// ======================================================
// Building Care System Enterprise v4.3
// Electricity Service
// ======================================================

import {
  ApiResponse,
  ElectricityDashboard,
  ElectricitySummary,
  ElectricityChart,
  ElectricityBenchmark,
  ElectricityRecord,
  ElectricityDetail,
  ElectricityHealth,
  ElectricityStatistics,
  ElectricityEntityAnalytics
} from "../types/electricity";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL";

/**
 * Generic Request
 */

async function request<T>(
  action: string,
  params?: Record<string, string | number>
): Promise<ApiResponse<T>> {

  const url = new URL(API_URL);

  url.searchParams.set("action", action);

  if (params) {

    Object.entries(params).forEach(([key, value]) => {

      url.searchParams.set(key, String(value));

    });

  }

  const response = await fetch(url.toString());

  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}`
    );

  }

  return await response.json();

}

/**
 * Dashboard
 */

export function getDashboard() {

  return request<ElectricityDashboard>(
    "getElectricityDashboard"
  );

}

/**
 * Summary
 */

export function getSummary() {

  return request<ElectricitySummary>(
    "getElectricitySummary"
  );

}

/**
 * Chart
 */

export function getChart() {

  return request<ElectricityChart[]>(
    "getElectricityChart"
  );

}

/**
 * Trend
 */

export function getTrend() {

  return request<any[]>(
    "getElectricityTrend"
  );

}

/**
 * Benchmark
 */

export function getBenchmark() {

  return request<ElectricityBenchmark[]>(
    "getElectricityBenchmark"
  );

}

/**
 * Analytics
 */

export function getAnalytics() {

  return request<ElectricityEntityAnalytics>(
    "getElectricityAnalytics"
  );

}

/**
 * Statistics
 */

export function getStatistics() {

  return request<ElectricityStatistics>(
    "getElectricityStatistics"
  );

}

/**
 * Alert Summary
 */

export function getAlertSummary() {

  return request<any>(
    "getElectricityAlertSummary"
  );

}

/**
 * Latest Alert
 */

export function getLatestAlert() {

  return request<ElectricityRecord[]>(
    "getElectricityRecentAlerts"
  );

}

/**
 * List
 */

export function getList() {

  return request<ElectricityRecord[]>(
    "getElectricityList"
  );

}

/**
 * Detail Meter
 */

export function getDetail(
  id: string
) {

  return request<ElectricityDetail>(
    "getElectricityDetail",
    {
      id
    }
  );

}

/**
 * Filter Bulan
 */

export function getByMonth(
  month: string
) {

  return request<ElectricityRecord[]>(
    "getElectricityByMonth",
    {
      month
    }
  );

}

/**
 * Filter Entitas
 */

export function getByEntity(
  entitas: string
) {

  return request<ElectricityRecord[]>(
    "getElectricityByEntity",
    {
      entitas
    }
  );

}

/**
 * Entity List
 */

export function getEntityList() {

  return request<string[]>(
    "getElectricityEntityList"
  );

}

/**
 * Month List
 */

export function getMonthList() {

  return request<string[]>(
    "getElectricityMonthList"
  );

}

/**
 * Refresh Cache
 */

export function refreshCache() {

  return request<any>(
    "refreshElectricityCache"
  );

}

/**
 * Health Check
 */

export function getHealth() {

  return request<ElectricityHealth>(
    "getElectricityHealth"
  );

}
