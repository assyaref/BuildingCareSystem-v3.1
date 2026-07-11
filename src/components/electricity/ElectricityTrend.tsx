// ======================================================
// Building Care System Enterprise v4.3
// ElectricityTrend.tsx
// ======================================================

import {

    TrendingUp,

    TrendingDown,

    Minus

} from "lucide-react";

import {

    ElectricityTrend as Trend

} from "../../types/electricity";

interface Props{

    data:Trend[];

}

export default function ElectricityTrend({

    data

}:Props){

    return(

        <div className="bg-white rounded-2xl border shadow-sm p-6">

            <h2 className="text-xl font-semibold mb-5">

                Monthly Trend

            </h2>

            <div className="space-y-4">

                {

                    data.map(item=>{

                        const positive=item.trendType==="UP";

                        const negative=item.trendType==="DOWN";

                        const stable=item.trendType==="STABLE";

                        return(

                            <div

                                key={item.month}

                                className="flex justify-between items-center border-b pb-3"

                            >

                                <div>

                                    <div className="font-semibold">

                                        {item.month}

                                    </div>

                                    <div className="text-sm text-gray-500">

                                        {item.value.toLocaleString("id-ID")} kWh

                                    </div>

                                </div>

                                <div className="flex items-center gap-3">

                                    {

                                        positive &&

                                        <TrendingUp

                                            className="text-green-600"

                                        />

                                    }

                                    {

                                        negative &&

                                        <TrendingDown

                                            className="text-red-600"

                                        />

                                    }

                                    {

                                        stable &&

                                        <Minus

                                            className="text-gray-400"

                                        />

                                    }

                                    <span

                                        className={`font-semibold ${
                                            positive
                                            ? "text-green-600"
                                            : negative
                                            ? "text-red-600"
                                            : "text-gray-500"
                                        }`}

                                    >

                                        {item.percentChange.toFixed(2)}%

                                    </span>

                                </div>

                            </div>

                        )

                    })

                }

            </div>

        </div>

    )

}
