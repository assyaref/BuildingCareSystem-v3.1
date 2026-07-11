// ======================================================
// Building Care System Enterprise v4.3
// ElectricityChart.tsx
// ======================================================

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

import { Line } from "react-chartjs-2";

import { ElectricityChart } from "../../types/electricity";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

interface Props{
    data:ElectricityChart[];
}

export default function ElectricityChart({data}:Props){

    const chartData={

        labels:data.map(i=>i.month),

        datasets:[

            {

                label:"Pemakaian Listrik (kWh)",

                data:data.map(i=>i.value),

                borderWidth:3,

                tension:.35,

                fill:true,

                borderColor:"#1565C0",

                backgroundColor:"rgba(21,101,192,.15)",

                pointRadius:5,

                pointHoverRadius:8

            }

        ]

    };

    const options={

        responsive:true,

        maintainAspectRatio:false,

        plugins:{

            legend:{
                display:false
            }

        },

        scales:{

            y:{

                beginAtZero:true,

                ticks:{
                    callback:(value:any)=>

                        value.toLocaleString("id-ID")+" kWh"

                }

            }

        }

    };

    return(

        <div className="bg-white rounded-2xl shadow-sm border p-6">

            <div className="flex items-center justify-between mb-5">

                <div>

                    <h2 className="text-xl font-semibold">

                        Monthly Electricity Consumption

                    </h2>

                    <p className="text-gray-500 text-sm">

                        Grafik pemakaian listrik setiap bulan

                    </p>

                </div>

            </div>

            <div className="h-96">

                <Line

                    data={chartData}

                    options={options}

                />

            </div>

        </div>

    );

}
