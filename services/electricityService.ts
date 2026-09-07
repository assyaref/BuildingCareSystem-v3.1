const BASE = import.meta.env.VITE_API_URL;

// ==========================================================
// DASHBOARD & DATA
// ==========================================================

export async function getElectricityDashboard() {
  const res = await fetch(`${BASE}?action=getElectricityDashboard`);
  return await res.json();
}

export async function refreshElectricityCache() {
  const res = await fetch(`${BASE}?action=refreshElectricityCache`);
  return await res.json();
}

export async function getElectricityDetail(id: string) {
  const res = await fetch(`${BASE}?action=getElectricityDetail&id=${id}`);
  return await res.json();
}

export async function getElectricityList() {
  const res = await fetch(`${BASE}?action=getElectricityList`);
  return await res.json();
}

// ==========================================================
// EXPORT FUNCTIONS
// ==========================================================

/**
 * Export data listrik ke PDF atau Excel
 * @param format - 'pdf' atau 'excel'
 * @param type - 'table' atau 'dashboard'
 */
export async function exportElectricityData(format: 'pdf' | 'excel', type: 'table' | 'dashboard') {
  const res = await fetch(`${BASE}?action=exportElectricity&format=${format}&type=${type}`);
  
  if (format === 'pdf') {
    return await res.blob();
  }
  return await res.json();
}

/**
 * Export tabel data listrik dengan filter ke PDF
 */
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

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Gagal export data');
  }
  return await res.blob();
}

/**
 * Export dashboard listrik ke PDF
 */
export async function exportDashboardPDF() {
  const params = new URLSearchParams();
  params.append('action', 'exportDashboardPDF');

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Gagal export dashboard');
  }
  return await res.blob();
}

// ==========================================================
// CRUD OPERATIONS
// ==========================================================

/**
 * Generic API request wrapper untuk CRUD operations
 */
export async function request(method: string, action: string, data?: any) {
  const url = new URL(BASE);
  url.searchParams.append('action', action);

  const options: RequestInit = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url.toString(), options);
  return await res.json();
}

// ==========================================================
// SPECIFIC CRUD OPERATIONS (Convenience Functions)
// ==========================================================

/**
 * Create new electricity record
 */
export async function createElectricityRecord(data: any) {
  return request('POST', 'createElectricityRecord', data);
}

/**
 * Update existing electricity record
 */
export async function updateElectricityRecord(data: any) {
  return request('POST', 'updateElectricityRecord', data);
}

/**
 * Delete electricity record
 */
export async function deleteElectricityRecord(id: string, bulan: string, posisi: string) {
  return request('POST', 'deleteElectricityRecord', { id, bulan, posisi });
}
