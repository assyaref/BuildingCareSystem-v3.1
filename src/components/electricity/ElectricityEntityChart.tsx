// ======================================================
// Building Care System Enterprise v4.3
// ElectricityEntityChart.tsx
// ======================================================

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

import {
    ElectricityBenchmark
} from "../../types/electricity";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface Props{

    data:ElectricityBenchmark[];

}

export default function ElectricityEntityChart({

    data

}:Props){

    const chartData={

        labels:data.map(item=>item.entitas),

        datasets:[

            {

                data:data.map(item=>item.totalKwh),

                backgroundColor:[

                    "#1565C0",
                    "#2E7D32",
                    "#F9A825",
                    "#EF6C00",
                    "#8E24AA",
                    "#00897B",
                    "#3949AB",
                    "#D81B60"

                ],

                borderWidth:2

            }

        ]

    };

    const options={

        responsive:true,

        maintainAspectRatio:false,

        plugins:{

            legend:{
                position:"bottom" as const
            }

        }

    };

    return(

        <div className="bg-white rounded-2xl shadow-sm border p-6">

            <div className="mb-4">

                <h2 className="text-xl font-semibold">

                    Electricity Usage by Entity

                </h2>

                <p className="text-gray-500 text-sm">

                    Distribusi konsumsi listrik berdasarkan entitas

                </p>

            </div>

            <div className="h-96">

                <Doughnut

                    data={chartData}

                    options={options}

                />

            </div>

        </div>

    );

}
