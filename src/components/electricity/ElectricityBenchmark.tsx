// ======================================================
// Building Care System Enterprise v4.3
// ElectricityBenchmark.tsx
// ======================================================

import { ElectricityBenchmark } from "../../types/electricity";

interface Props {
  data: ElectricityBenchmark[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export default function ElectricityBenchmark({ data }: Props) {

  return (

    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="mb-5">

        <h2 className="text-xl font-semibold">

          Benchmark Consumption

        </h2>

        <p className="text-sm text-gray-500">

          Perbandingan konsumsi listrik tiap entitas

        </p>

      </div>

      <div className="overflow-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-3">Entitas</th>

              <th className="text-right py-3">kWh</th>

              <th className="text-right py-3">Meter</th>

              <th className="text-right py-3">Avg / Meter</th>

              <th className="text-right py-3">Benchmark</th>

              <th className="text-right py-3">Estimasi Biaya</th>

            </tr>

          </thead>

          <tbody>

            {data.map(item => (

              <tr
                key={item.entitas}
                className="border-b hover:bg-gray-50"
              >

                <td className="py-4 font-medium">

                  {item.entitas}

                </td>

                <td className="text-right">

                  {item.totalKwh.toLocaleString("id-ID")}

                </td>

                <td className="text-right">

                  {item.totalMeter}

                </td>

                <td className="text-right">

                  {item.avgPerMeter.toFixed(1)}

                </td>

                <td className="text-right">

                  <div className="flex justify-end">

                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-semibold

                        ${
                          item.benchmark >= 100

                            ? "bg-red-100 text-red-700"

                            : "bg-green-100 text-green-700"

                        }
                      `}
                    >

                      {item.benchmark} %

                    </span>

                  </div>

                </td>

                <td className="text-right">

                  {formatCurrency(item.estimatedCost)}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}
