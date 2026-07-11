export interface ElectricitySummary {

  totalRecord:number;

  totalMeter:number;

  totalKwh:number;

  totalNominal:number;

  averageKwhPerMeter:number;

  averageNominalPerMeter:number;

}

export interface ElectricityKPI{

 title:string;

 value:number;

 unit:string;

 icon:string;

}

export interface ElectricityChart{

 month:string;

 value:number;

}

export interface ElectricityEntity{

 entitas:string;

 totalKwh:number;

 totalNominal:number;

 totalMeter:number;

 avgPerMeter:number;

}

export interface ElectricityAlert{

 bulan:string;

 idPelanggan:string;

 entitas:string;

 status:string;

 keterangan:string;

}

export interface ElectricityDashboard{

 summary:ElectricitySummary;

 chart:ElectricityChart[];

 trend:any[];

 benchmark:any[];

 entityTop:any;

 alerts:any;

 latestAlerts:ElectricityAlert[];

 kpi:ElectricityKPI[];

 generatedAt:string;

}
