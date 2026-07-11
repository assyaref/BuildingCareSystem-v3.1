// ======================================================
// Building Care System Enterprise v4.3
// ElectricityAlert.tsx
// ======================================================

import {
    AlertTriangle,
    Wrench,
    ZapOff,
    GaugeCircleOff,
    CheckCircle2
} from "lucide-react";

import { ElectricityRecord } from "../../types/electricity";

interface Props {

    data: ElectricityRecord[];

    onSelect?: (id: string) => void;

}

function getBadge(status: string) {

    switch (status) {

        case "MAINTENANCE":
            return {
                icon: Wrench,
                color: "bg-yellow-100 text-yellow-700",
                text: "Maintenance"
            };

        case "GANTI_METER":
            return {
                icon: AlertTriangle,
                color: "bg-red-100 text-red-700",
                text: "Ganti Meter"
            };

        case "NEGATIVE":
            return {
                icon: ZapOff,
                color: "bg-orange-100 text-orange-700",
                text: "Negative"
            };

        case "NO_READING":
            return {
                icon: GaugeCircleOff,
                color: "bg-gray-200 text-gray-700",
                text: "No Reading"
            };

        default:
            return {
                icon: CheckCircle2,
                color: "bg-green-100 text-green-700",
                text: "Normal"
            };

    }

}

export default function ElectricityAlert({

    data,

    onSelect

}: Props) {

    return (

        <div className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex justify-between items-center mb-6">

                <div>

                    <h2 className="text-xl font-semibold">

                        Electricity Alert

                    </h2>

                    <p className="text-sm text-gray-500">

                        Monitoring kondisi meter listrik

                    </p>

                </div>

                <span className="px-3 py-1 rounded-full bg-red-600 text-white text-sm">

                    {data.length} Alert

                </span>

            </div>

            <div className="space-y-3">

                {data.length === 0 && (

                    <div className="text-center py-8 text-gray-500">

                        Tidak ada alert.

                    </div>

                )}

                {data.map((item) => {

                    const badge = getBadge(item.status);

                    const Icon = badge.icon;

                    return (

                        <div

                            key={`${item.idPelanggan}-${item.bulan}`}

                            className="border rounded-xl p-4 hover:bg-gray-50 transition"

                        >

                            <div className="flex justify-between">

                                <div>

                                    <div className="font-semibold">

                                        {item.entitas}

                                    </div>

                                    <div className="text-sm text-gray-500">

                                        Meter :

                                        {" "}

                                        {item.idPelanggan}

                                    </div>

                                </div>

                                <div>

                                    <span

                                        className={`

                                            inline-flex

                                            items-center

                                            gap-2

                                            px-3

                                            py-1

                                            rounded-full

                                            text-xs

                                            font-semibold

                                            ${badge.color}

                                        `}

                                    >

                                        <Icon size={14} />

                                        {badge.text}

                                    </span>

                                </div>

                            </div>

                            <div className="mt-4 text-sm">

                                <div>

                                    <strong>Bulan :</strong>

                                    {" "}

                                    {item.bulan}

                                </div>

                                <div>

                                    <strong>Keterangan :</strong>

                                    {" "}

                                    {item.keterangan || "-"}

                                </div>

                            </div>

                            <div className="mt-4 flex justify-end">

                                <button

                                    onClick={() => onSelect?.(item.idPelanggan)}

                                    className="

                                        bg-blue-600

                                        hover:bg-blue-700

                                        text-white

                                        px-4

                                        py-2

                                        rounded-lg

                                        text-sm

                                    "

                                >

                                    Detail

                                </button>

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}
