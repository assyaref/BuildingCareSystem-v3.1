// ======================================================
// Building Care System Enterprise v4.3
// ElectricityPage.tsx
// ======================================================

import { useState } from "react";

import { RefreshCw } from "lucide-react";

import { useElectricity } from "../hooks/useElectricity";

import ElectricitySummary from "../components/electricity/ElectricitySummary";
import ElectricityChart from "../components/electricity/ElectricityChart";
import ElectricityTrend from "../components/electricity/ElectricityTrend";
import ElectricityEntityChart from "../components/electricity/ElectricityEntityChart";
import ElectricityBenchmark from "../components/electricity/ElectricityBenchmark";
import ElectricityTopConsumer from "../components/electricity/ElectricityTopConsumer";
import ElectricityAlert from "../components/electricity/ElectricityAlert";
import ElectricityTable from "../components/electricity/ElectricityTable";

export default function ElectricityPage() {

    const {

        loading,

        refreshing,

        dashboard,

        error,

        refresh

    } = useElectricity();

    const [selectedMeter, setSelectedMeter] =
        useState<string | null>(null);

    //----------------------------------------------------
    // Loading
    //----------------------------------------------------

    if (loading) {

        return (

            <div className="flex items-center justify-center h-[80vh]">

                <div className="text-gray-500">

                    Loading Electricity Dashboard...

                </div>

            </div>

        );

    }

    //----------------------------------------------------
    // Error
    //----------------------------------------------------

    if (error || !dashboard) {

        return (

            <div className="bg-red-50 border border-red-200 rounded-xl p-8">

                <h2 className="text-xl font-bold text-red-700">

                    Gagal Memuat Dashboard

                </h2>

                <p className="text-red-600 mt-2">

                    {error}

                </p>

            </div>

        );

    }

    //----------------------------------------------------
    // Render
    //----------------------------------------------------

    return (

        <div className="space-y-6">

            {/* Header */}

            <div className="flex justify-between items-center">

                <div>

                    <h1 className="text-3xl font-bold">

                        ⚡ Electricity Management

                    </h1>

                    <p className="text-gray-500">

                        Monitoring Pemakaian Listrik

                    </p>

                </div>

                <button

                    onClick={refresh}

                    disabled={refreshing}

                    className="

                        bg-blue-600

                        hover:bg-blue-700

                        text-white

                        px-5

                        py-3

                        rounded-xl

                        flex

                        items-center

                        gap-2

                    "

                >

                    <RefreshCw

                        size={18}

                        className={

                            refreshing

                                ? "animate-spin"

                                : ""

                        }

                    />

                    Refresh

                </button>

            </div>

            {/* KPI */}

            <ElectricitySummary

                data={dashboard.kpi}

            />

            {/* Chart */}

            <ElectricityChart

                data={dashboard.chart}

            />

            {/* Trend + Entity */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <ElectricityTrend

                    data={dashboard.trend}

                />

                <ElectricityEntityChart

                    data={dashboard.benchmark}

                />

            </div>

            {/* Benchmark + Top Consumer */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <ElectricityBenchmark

                    data={dashboard.benchmark}

                />

                <ElectricityTopConsumer

                    data={dashboard.analytics.topConsumer}

                    onSelect={(id)=>{

                        setSelectedMeter(id);

                    }}

                />

            </div>

            {/* Alert */}

            <ElectricityAlert

                data={dashboard.latestAlerts}

                onSelect={(id)=>{

                    setSelectedMeter(id);

                }}

            />

            {/* Table */}

            <ElectricityTable

                data={dashboard.summary.entity.length
                    ? dashboard.latestAlerts
                    : []
                }

                onDetail={(id)=>{

                    setSelectedMeter(id);

                }}

            />

            {/* Footer */}

            <div className="text-center text-sm text-gray-400">

                Last Update :

                {" "}

                {dashboard.generatedAt}

            </div>

        </div>

    );

}
