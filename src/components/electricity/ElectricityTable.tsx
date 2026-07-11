// ======================================================
// Building Care System Enterprise v4.3
// ElectricityTable.tsx
// ======================================================

import { useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import { ElectricityRecord } from "../../types/electricity";

interface Props {

    data: ElectricityRecord[];

    onDetail?: (id: string) => void;

}

const PAGE_SIZE = 10;

export default function ElectricityTable({

    data,

    onDetail

}: Props) {

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);

    const [status, setStatus] = useState("ALL");

    const filtered = useMemo(() => {

        return data.filter(item => {

            const keyword =
                search.toLowerCase();

            const matchKeyword =

                item.entitas.toLowerCase().includes(keyword)

                ||

                item.idPelanggan.toLowerCase().includes(keyword);

            const matchStatus =

                status === "ALL"

                ||

                item.status === status;

            return matchKeyword && matchStatus;

        });

    }, [data, search, status]);

    const totalPage =

        Math.ceil(filtered.length / PAGE_SIZE);

    const rows = filtered.slice(

        (page - 1) * PAGE_SIZE,

        page * PAGE_SIZE

    );

    return (

        <div className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex flex-col md:flex-row gap-3 justify-between mb-5">

                <h2 className="text-xl font-semibold">

                    Electricity History

                </h2>

                <div className="flex gap-3">

                    <div className="relative">

                        <Search

                            size={18}

                            className="absolute left-3 top-3 text-gray-400"

                        />

                        <input

                            className="border rounded-lg pl-10 pr-4 py-2"

                            placeholder="Cari meter..."

                            value={search}

                            onChange={(e)=>{

                                setSearch(e.target.value);

                                setPage(1);

                            }}

                        />

                    </div>

                    <select

                        value={status}

                        onChange={(e)=>{

                            setStatus(e.target.value);

                            setPage(1);

                        }}

                        className="border rounded-lg px-3"

                    >

                        <option value="ALL">

                            Semua Status

                        </option>

                        <option value="NORMAL">

                            Normal

                        </option>

                        <option value="MAINTENANCE">

                            Maintenance

                        </option>

                        <option value="GANTI_METER">

                            Ganti Meter

                        </option>

                        <option value="NEGATIVE">

                            Negative

                        </option>

                        <option value="NO_READING">

                            No Reading

                        </option>

                    </select>

                </div>

            </div>

            <div className="overflow-auto">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="text-left py-3">

                                Bulan

                            </th>

                            <th>

                                Entitas

                            </th>

                            <th>

                                Meter

                            </th>

                            <th>

                                kWh

                            </th>

                            <th>

                                Nominal

                            </th>

                            <th>

                                Status

                            </th>

                            <th>

                                Action

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            rows.map(item=>(

                                <tr

                                    key={

                                        item.idPelanggan+

                                        item.bulan

                                    }

                                    className="border-b hover:bg-gray-50"

                                >

                                    <td>

                                        {item.bulan}

                                    </td>

                                    <td>

                                        {item.entitas}

                                    </td>

                                    <td>

                                        {item.idPelanggan}

                                    </td>

                                    <td>

                                        {

                                            item.pemakaian.toLocaleString("id-ID")

                                        }

                                    </td>

                                    <td>

                                        {

                                            item.nominal.toLocaleString("id-ID")

                                        }

                                    </td>

                                    <td>

                                        <span

                                            className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs"

                                        >

                                            {item.status}

                                        </span>

                                    </td>

                                    <td>

                                        <button

                                            onClick={()=>

                                                onDetail?.(

                                                    item.idPelanggan

                                                )

                                            }

                                            className="text-blue-600"

                                        >

                                            <Eye/>

                                        </button>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

            <div className="flex justify-end gap-2 mt-5">

                <button

                    disabled={page===1}

                    onClick={()=>setPage(page-1)}

                    className="border px-4 py-2 rounded"

                >

                    Prev

                </button>

                <span className="px-3 py-2">

                    {page}/{totalPage||1}

                </span>

                <button

                    disabled={page===totalPage}

                    onClick={()=>setPage(page+1)}

                    className="border px-4 py-2 rounded"

                >

                    Next

                </button>

            </div>

        </div>

    );

}
