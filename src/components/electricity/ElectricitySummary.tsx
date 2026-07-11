// ======================================================
// Building Care System Enterprise v4.3
// ElectricitySummary.tsx
// ======================================================

import {
  Zap,
  DollarSign,
  Gauge,
  BarChart3
} from "lucide-react";

import { ElectricityKPI } from "../../types/electricity";

interface Props {
  data: ElectricityKPI[];
}

const iconMap = {
  bolt: Zap,
  payments: DollarSign,
  speed: Gauge,
  analytics: BarChart3
};

function formatValue(value: number, unit: string) {
  if (unit === "Rp") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  }

  return new Intl.NumberFormat("id-ID").format(
    Math.round(value)
  );
}

export default function ElectricitySummary({
  data
}: Props) {

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

      {data.map((item) => {

        const Icon =
          iconMap[item.icon as keyof typeof iconMap] ||
          BarChart3;

        return (

          <div
            key={item.title}
            className="bg-white rounded-2xl shadow-sm p-6 border"
          >

            <div className="flex justify-between">

              <div>

                <p className="text-gray-500 text-sm">

                  {item.title}

                </p>

                <h2 className="text-3xl font-bold mt-2">

                  {formatValue(item.value, item.unit)}

                </h2>

                <p className="text-sm text-gray-400 mt-1">

                  {item.unit}

                </p>

              </div>

              <div
                className="
                w-14
                h-14
                rounded-xl
                bg-blue-50
                flex
                items-center
                justify-center"
              >

                <Icon
                  size={28}
                  className="text-blue-700"
                />

              </div>

            </div>

          </div>

        );

      })}

    </div>

  );

}
