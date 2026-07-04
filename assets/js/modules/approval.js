
/**
 * ==========================================================
 * Building Care System Enterprise
 * approval.js
 * ==========================================================
 */

const ApprovalModule = {

    data: [],

    async load() {

        try {

            showLoading();

            const res = await apiRequest({
                action: "getApprovalList"
            });

            if (!res.success) {
                showToast(res.message, "danger");
                return;
            }

            this.data = res.data;
            this.render();

        } catch (err) {

            console.error(err);
            showToast("Gagal memuat data approval.", "danger");

        } finally {

            hideLoading();

        }

    },

    render() {

        const tbody = document.querySelector("#approvalTable tbody");

        tbody.innerHTML = "";

        if (this.data.length === 0) {

            tbody.innerHTML =
            `<tr>
                <td colspan="8" class="text-center">
                    Tidak ada data.
                </td>
            </tr>`;

            return;
        }

        this.data.forEach((item,index)=>{

            tbody.innerHTML += `
            <tr>

                <td>${index+1}</td>

                <td>${item.id}</td>

                <td>${item.lokasi}</td>

                <td>${item.kategori}</td>

                <td>${item.pelapor}</td>

                <td>${this.badge(item.status)}</td>

                <td>

                    <button
                        class="btn btn-success btn-sm"
                        onclick="ApprovalModule.approve('${item.id}')">

                        Approve

                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="ApprovalModule.reject('${item.id}')">

                        Reject

                    </button>

                </td>

            </tr>
            `;

        });

    },

    badge(status){

        switch(status){

            case "OPEN":
                return `<span class="badge bg-warning">OPEN</span>`;

            case "APPROVED":
                return `<span class="badge bg-success">APPROVED</span>`;

            case "REJECT":
                return `<span class="badge bg-danger">REJECT</span>`;

            default:
                return status;

        }

    },

    async approve(id){

        if(!confirm("Approve laporan ini?")) return;

        const res = await apiRequest({

            action:"updateApproval",
            id:id,
            status:"APPROVED"

        });

        if(res.success){

            showToast("Approval berhasil","success");

            this.load();

        }else{

            showToast(res.message,"danger");

        }

    },

    async reject(id){

        const alasan = prompt("Masukkan alasan penolakan");

        if(alasan===null) return;

        const res = await apiRequest({

            action:"updateApproval",
            id:id,
            status:"REJECT",
            reason:alasan

        });

        if(res.success){

            showToast("Laporan ditolak","warning");

            this.load();

        }else{

            showToast(res.message,"danger");

        }

    }

};

document.addEventListener("DOMContentLoaded",()=>{

    ApprovalModule.load();

});
