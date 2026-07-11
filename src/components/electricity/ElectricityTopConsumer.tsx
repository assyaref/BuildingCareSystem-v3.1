// ======================================================
// Building Care System Enterprise v4.3
// ElectricityTopConsumer.tsx
// ======================================================

import { Trophy, Zap } from "lucide-react";

interface TopConsumer {

    id: string;

    entitas: string;

    totalKwh: number;

    totalNominal: number;

}

interface Props{

    data:TopConsumer[];

    onSelect?:(id:string)=>void;

}

function formatCurrency(value:number){

    return new Intl.NumberFormat("id-ID",{

        style:"currency",

        currency:"IDR",

        maximumFractionDigits:0

    }).format(value);

}

export default function ElectricityTopConsumer({

    data,

    onSelect

}:Props){

    return(

        <div className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex items-center gap-3 mb-6">

                <Trophy className="text-yellow-500"/>

                <h2 className="text-xl font-semibold">

                    Top Consumer

                </h2>

            </div>

            <div className="space-y-4">

                {

                    data.map((item,index)=>(

                        <div

                            key={item.id}

                            onClick={()=>onSelect?.(item.id)}

                            className="

                                cursor-pointer

                                rounded-xl

                                border

                                p-4

                                hover:bg-gray-50

                                transition

                            "

                        >

                            <div className="flex justify-between">

                                <div>

                                    <div className="font-semibold">

                                        #{index+1}

                                        {" "}

                                        {item.entitas}

                                    </div>

                                    <div className="text-sm text-gray-500">

                                        Meter :

                                        {" "}

                                        {item.id}

                                    </div>

                                </div>

                                <Zap

                                    className="text-yellow-500"

                                />

                            </div>

                            <div className="grid grid-cols-2 mt-4">

                                <div>

                                    <div className="text-xs text-gray-500">

                                        Pemakaian

                                    </div>

                                    <div className="font-semibold">

                                        {item.totalKwh.toLocaleString("id-ID")}

                                        {" "}kWh

                                    </div>

                                </div>

                                <div className="text-right">

                                    <div className="text-xs text-gray-500">

                                        Biaya

                                    </div>

                                    <div className="font-semibold">

                                        {formatCurrency(item.totalNominal)}

                                    </div>

                                </div>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    )

}
