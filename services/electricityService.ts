const BASE=import.meta.env.VITE_API_URL;

export async function getElectricityDashboard(){

 const res=await fetch(

 `${BASE}?action=getElectricityDashboard`

 );

 return await res.json();

}

export async function refreshElectricityCache(){

 const res=await fetch(

 `${BASE}?action=refreshElectricityCache`

 );

 return await res.json();

}

export async function getElectricityDetail(id:string){

 const res=await fetch(

 `${BASE}?action=getElectricityDetail&id=${id}`

 );

 return await res.json();

}

// Export functions
export async function exportElectricityData(format: 'pdf' | 'excel', type: 'table' | 'dashboard') {
 const res=await fetch(
   `${BASE}?action=exportElectricity&format=${format}&type=${type}`
 );
 
 if (format === 'pdf') {
   return await res.blob();
 }
 return await res.json();
}

export async function exportElectricityTable(filter?: {
 keyword?: string;
 status?: string;
 page?: number;
 pageSize?: number;
}) {
 const params = new URLSearchParams();
 params.append('action', 'exportElectricityTable');
 if (filter?.keyword) params.append('keyword', filter.keyword);
 if (filter?.status && filter.status !== 'ALL') params.append('status', filter.status);
 if (filter?.page) params.append('page', String(filter.page));
 if (filter?.pageSize) params.append('pageSize', String(filter.pageSize));
 
 const res=await fetch(`${BASE}?${params.toString()}`);
 return await res.blob();
}

export async function exportDashboardPDF() {
 const res=await fetch(
   `${BASE}?action=exportDashboardPDF`
 );
 return await res.blob();
}
