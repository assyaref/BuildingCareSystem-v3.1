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
