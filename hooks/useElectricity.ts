export function useElectricity(){

 const [loading,setLoading]=useState(true);

 const [dashboard,setDashboard]=useState();

 const load=async()=>{

 ...

 }

 return{

 loading,

 dashboard,

 refresh:load

 }

}
