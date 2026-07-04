// Muat SETELAH script lama approval.
(function(){
"use strict"; var data=[];
function ses(){if(window.BCS&&BCS.Storage&&BCS.Storage.getSession)return BCS.Storage.getSession();try{return JSON.parse(localStorage.getItem("bcs_session")||"null")}catch(e){return null}}
function api(a,d){var s=ses();if(!s||!s.token)return Promise.reject(new Error("Session tidak ditemukan"));d=d||{};d.token=s.token;return BCS.Api.post(a,d)}
function rp(n){return"Rp "+Number(n||0).toLocaleString("id-ID")}
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]})}

async function load(){
 var r=await api("getPendingBudgetApprovals",{});
 if(!r||!r.success)throw new Error(r&&r.message||"Gagal mengambil approval");
 data=r.data&&r.data.approvals||[]; render();
}
function render(){
 var box=document.getElementById("approvalList"), count=document.getElementById("pendingCount");
 var f=document.getElementById("filterPriority"), p=f?f.value:"";
 var rows=data.filter(function(x){return !p||x.priority===p});
 if(count)count.textContent=data.length; if(!box)return;
 if(!rows.length){box.innerHTML='<div class="text-center text-muted py-5"><i class="bi bi-shield-check text-success d-block display-3 mb-3"></i><span class="fw-semibold fs-5">Tidak ada budget menunggu persetujuan</span></div>';return}
 box.innerHTML=rows.map(function(a){return '<div class="approval-item"><div class="info-wrapper"><div class="category-indicator" style="background:#e0f2fe;color:#0284c7"><i class="bi bi-cash-stack"></i></div><div class="info"><div class="title">'+esc(a.description||a.id)+'</div><div class="sub"><span><b>'+esc(a.id)+'</b></span><span class="divider">•</span><span>WO '+esc(a.wo_number||a.wo_id||"-")+'</span><span class="divider">•</span><span>'+rp(a.total)+'</span><span class="divider">•</span><span>'+esc(a.priority||"medium")+'</span></div></div></div><div class="actions"><button class="btn-action btn-reject" data-r="'+esc(a.id)+'"><i class="bi bi-x-lg"></i>Tolak</button><button class="btn-action btn-approve" data-a="'+esc(a.id)+'"><i class="bi bi-check-lg"></i>Setujui</button></div></div>'}).join("");
 box.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){decide("approveBudget",this.dataset.a)}});
 box.querySelectorAll("[data-r]").forEach(function(b){b.onclick=function(){decide("rejectBudget",this.dataset.r)}});
}
async function decide(action,id){
 var ok=await Swal.fire({title:action==="approveBudget"?"Setujui Budget?":"Tolak Budget?",input:"textarea",inputLabel:"Catatan",showCancelButton:true,confirmButtonText:action==="approveBudget"?"Setujui":"Tolak"});
 if(!ok.isConfirmed)return;
 try{var r=await api(action,{id:id,notes:ok.value||""});if(!r.success)throw new Error(r.message||"Proses gagal");await load();Swal.fire("Berhasil",r.message,"success")}catch(e){Swal.fire("Gagal",e.message,"error")}
}
document.addEventListener("DOMContentLoaded",function(){setTimeout(function(){var f=document.getElementById("filterPriority");if(f)f.addEventListener("change",render);load().catch(function(e){Swal.fire("API Approval",e.message,"error")})},450)});
})();
