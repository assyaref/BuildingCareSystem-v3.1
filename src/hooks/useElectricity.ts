// ======================================================
// Building Care System Enterprise v4.3
// useElectricity.ts
// ======================================================

import { useState, useEffect, useCallback } from "react";

import * as electricityService from "../services/electricityService";

import { ElectricityDashboard } from "../types/electricity";

export function useElectricity() {

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [dashboard, setDashboard] =
    useState<ElectricityDashboard | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  //------------------------------------------------------
  // Load Dashboard
  //------------------------------------------------------

  const loadDashboard = useCallback(async () => {

    try {

      setLoading(true);

      setError(null);

      const response =
        await electricityService.getDashboard();

      if (!response.success) {

        throw new Error(
          response.message || "Unknown Error"
        );

      }

      setDashboard(response.data);

    } catch (err: any) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }, []);

  //------------------------------------------------------
  // Refresh
  //------------------------------------------------------

  const refresh = useCallback(async () => {

    try {

      setRefreshing(true);

      await electricityService.refreshCache();

      await loadDashboard();

    } finally {

      setRefreshing(false);

    }

  }, [loadDashboard]);

  //------------------------------------------------------
  // First Load
  //------------------------------------------------------

  useEffect(() => {

    loadDashboard();

  }, [loadDashboard]);

  return {

    loading,

    refreshing,

    error,

    dashboard,

    refresh

  };

}
