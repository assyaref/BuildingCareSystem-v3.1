"use strict";

const HistoryModule = (()=>{

async function init(){

    await loadReports();

}

async function loadReports(){

    try{

        const response = await Api.post(
            "getReport"
        );

        if(!response.success){

            App.toast(
                response.message,
                "error"
            );

            return;
        }

        render(
            response.data.reports
        );

    }

    catch(err){

        App.handleError(err);

    }

}

function render(reports){

    let html="";

    reports.reverse().forEach(r=>{

        html+=`

<tr>

<td>${r.id}</td>

<td>${r.tanggal}</td>

<td>${r.kategori}</td>

<td>${r.lokasi}</td>

<td>

<span class="badge bg-warning">

${r.status}

</span>

</td>

<td>

<a href="${r.foto}"
target="_blank">

<i class="bi bi-image"></i>

</a>

</td>

</tr>

`;

    });

    document
    .getElementById(
        "historyTable"
    )
    .innerHTML=html;

}

return{

    init

};

})();

document.addEventListener(
"DOMContentLoaded",
HistoryModule.init
);
