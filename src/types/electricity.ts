// ======================================================
// Building Care System Enterprise v4.3
// src/types/electricity.ts
// ======================================================

/**
 * Generic API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Summary
 */
export interface ElectricitySummary {
  totalRecord: number;
  totalMeter: number;
  totalKwh: number;
  totalNominal: number;
  averageKwhPerMeter: number;
  averageNominalPerMeter: number;
  averageKwhPerRecord?: number;
  averageNominalPerRecord?: number;

  entity: ElectricityEntitySummary[];
}

/**
 * Entity Summary
 */
export interface ElectricityEntitySummary {
  entitas: string;

  totalKwh: number;

  totalNominal: number;

  totalMeter: number;

  avgKwhPerMeter: number;

  avgNominalPerMeter: number;
}

/**
 * KPI
 */
export interface ElectricityKPI {

  title: string;

  value: number;

  unit: string;

  icon: string;

}

/**
 * Monthly Chart
 */
export interface ElectricityChart {

  month: string;

  value: number;

}

/**
 * Trend
 */
export interface ElectricityTrend {

  month: string;

  value: number;

  change: number;

  percentChange: number;

  trendType: "UP" | "DOWN" | "STABLE";

}

/**
 * Benchmark
 */
export interface ElectricityBenchmark {

  entitas: string;

  totalKwh: number;

  totalMeter: number;

  avgPerMeter: number;

  benchmark: number;

  estimatedCost: number;

}

/**
 * Meter History
 */
export interface ElectricityRecord {

  bulan: string;

  no: number;

  idPelanggan: string;

  entitas: string;

  awal: number;

  akhir: number;

  pemakaian: number;

  nominal: number;

  keterangan: string;

  status:
    | "NORMAL"
    | "NEGATIVE"
    | "NO_READING"
    | "MAINTENANCE"
    | "GANTI_METER"
    | "ALERT";

}

/**
 * Alert
 */
export interface ElectricityAlert {

  title?: string;

  value?: number;

  color?: string;

}

/**
 * Statistics
 */
export interface ElectricityStatistics {

  totalRecord:number;

  normal:number;

  negative:number;

  maintenance:number;

  gantiMeter:number;

  noReading:number;

  alert:number;

  quality:number;

}

/**
 * Entity Analytics
 */
export interface ElectricityEntityAnalytics{

  topUsage:ElectricityEntitySummary[];

  topCost:ElectricityEntitySummary[];

  highestAvg:ElectricityEntitySummary[];

  lowestAvg:ElectricityEntitySummary[];

}

/**
 * Dashboard
 */
export interface ElectricityDashboard{

  version:string;

  summary:ElectricitySummary;

  chart:ElectricityChart[];

  trend:ElectricityTrend[];

  benchmark:ElectricityBenchmark[];

  entityTop:ElectricityEntityAnalytics;

  alerts:{

    cards:ElectricityAlert[];

    data:ElectricityStatistics;

  };

  latestAlerts:ElectricityRecord[];

  kpi:ElectricityKPI[];

  generatedAt:string;

}

/**
 * Detail Meter
 */
export interface ElectricityDetail{

  id:string;

  totalRecord:number;

  history:ElectricityRecord[];

}

/**
 * Health
 */
export interface ElectricityHealth{

  module:string;

  version:string;

  status:string;

  totalRecords:number;

  totalMeters:number;

  totalEntities:number;

  cacheKey:string;

  cacheAge:string;

  cacheExpire:number;

  spreadsheet:string;

  sheet:string;

  executionTimeMs:number;

  serverTime:string;

  costPerKwh:number;

}
