// Muat SETELAH script lama budget.
(function(){
"use strict";
function ses(){if(window.BCS&&BCS.Storage&&BCS.Storage.getSession)return BCS.Storage.getSession();try{return JSON.parse(localStorage.getItem("bcs_session")||"null")}catch(e){return null}}
function api(a,d){var s=ses();if(!s||!s.token)return Promise.reject(new Error("Session tidak ditemukan"));d=d||{};d.token=s.token;return BCS.Api.post(a,d)}
function norm(b){return{id:b.id,woId:b.wo_id||"",reportId:b.wo_id||b.report_id||"",description:b.description||"",status:b.status||"pending",priority:b.priority||"medium",paymentMethod:b.payment_method||"cash",items:Array.isArray(b.items)?b.items:[],total:Number(b.total||0),notes:b.notes||"",createdAt:b.created_at||""}}

window.loadBudgetsActual=async function(){
 var r=await api("getBudgets",{});
 if(!r||!r.success)throw new Error(r&&r.message||"Gagal mengambil budget");
 window.budgetData=(r.data||[]).map(norm);
 if(typeof updateSummary==="function")updateSummary();
 if(typeof applyFilters==="function")applyFilters();
};

window.saveBudget=async function(e){
 e.preventDefault();
 var wo=DOM.budgetReportId.value.trim(), desc=DOM.budgetDescription.value.trim();
 if(!wo)return Swal.fire("Error","ID Work Order wajib diisi","error");
 if(!desc)return Swal.fire("Error","Deskripsi wajib diisi","error");
 var items=[];
 document.querySelectorAll(".item-row").forEach(function(row){
   var name=row.querySelector(".item-name").value.trim()||"Item";
   var qty=Number(row.querySelector(".item-qty").value)||0;
   var price=Number(row.querySelector(".item-price").value)||0;
   if(qty>0&&price>0)items.push({name:name,qty:qty,price:price,subtotal:qty*price});
 });
 if(!items.length)return Swal.fire("Error","Tambahkan minimal 1 item valid","error");
 var p={wo_id:wo,report_id:wo,description:desc,status:"pending",priority:DOM.budgetPriority.value,
   payment_method:DOM.budgetPaymentMethod.value,notes:DOM.budgetNotes.value.trim(),items:items};
 var action=window.editingId?"updateBudget":"createBudget";
 if(window.editingId)p.id=window.editingId;
 try{
   var r=await api(action,p); if(!r.success)throw new Error(r.message||"Gagal menyimpan");
   window.editingId=null; DOM.budgetModal.hide(); await window.loadBudgetsActual();
   Swal.fire("Berhasil",r.message||"Budget tersimpan ke Spreadsheet","success");
 }catch(err){Swal.fire("Gagal",err.message,"error")}
};

document.addEventListener("DOMContentLoaded",function(){
 setTimeout(function(){
   var f=document.getElementById("budgetForm");
   if(f){var c=f.cloneNode(true);f.parentNode.replaceChild(c,f);if(window.DOM)DOM.budgetForm=c;c.addEventListener("submit",window.saveBudget)}
   window.loadBudgetsActual().catch(function(e){Swal.fire("API Budget",e.message,"error")});
 },400);
});
})();
