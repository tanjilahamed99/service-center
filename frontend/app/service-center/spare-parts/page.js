// app/service-center/spare-parts/page.jsx
"use client";

import { useEffect, useState } from "react";
import {
  getMySparePartStock,
  getMySparePartTransactions,
} from "@/actions/service-center";

const TABS = [
  { key: "stock", label: "On-Hand Stock" },
  { key: "history", label: "Usage History" },
];

function TransactionTypeBadge({ type }) {
  const styles = {
    Allocate: "bg-gray-500/10 text-gray-600",
    Consume: "bg-amber-50 text-amber-600",
    Return: "bg-slate-100 text-slate-500",
    Restock: "bg-emerald-50 text-emerald-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[type] ?? "bg-slate-100 text-slate-500"}`}>
      {type}
    </span>
  );
}

export default function ServiceCenterSparePartsPage() {
  const [tab, setTab] = useState("stock");
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const request =
      tab === "stock" ? getMySparePartStock() : getMySparePartTransactions();
    request
      .then((res) => {
        if (tab === "stock") setStock(res.data?.data ?? []);
        else setTransactions(res.data?.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load spare parts data", err);
        setError("Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const filteredStock = stock.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.sparePart?.spareName?.toLowerCase().includes(q) ||
      s.sparePart?.product?.toLowerCase().includes(q) ||
      s.sparePart?.modelNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Spare Parts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stock allocated to your service center, and where it's gone.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-electric-500 text-electric-500"
                : "text-slate-500 hover:text-navy-900"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      {tab === "stock" && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, product or model number"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
            <div className="w-full overflow-x-auto">
              <table className="min-w-max text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Spare Name</th>

                    <th className="whitespace-nowrap px-4 py-3">
                      Brand / Product
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">Model No.</th>

                    <th className="whitespace-nowrap px-4 py-3">Category</th>

                    <th className="whitespace-nowrap px-4 py-3">On Hand</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredStock.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                        No spare parts allocated to your center yet.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((s) => (
                      <tr key={s._id} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                          {s.sparePart?.spareName}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {s.sparePart?.brand} / {s.sparePart?.product}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {s.sparePart?.modelNumber || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {s.sparePart?.category || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`font-semibold ${
                              s.quantity === 0
                                ? "text-red-500"
                                : "text-navy-900"
                            }`}>
                            {s.quantity} {s.sparePart?.unit}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="w-full overflow-x-auto">
            <table className="min-w-max text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>

                  <th className="whitespace-nowrap px-4 py-3">Spare Part</th>

                  <th className="whitespace-nowrap px-4 py-3">Type</th>

                  <th className="whitespace-nowrap px-4 py-3">Quantity</th>

                  <th className="whitespace-nowrap px-4 py-3">Job</th>

                  <th className="whitespace-nowrap px-4 py-3">Note</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                      No activity yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="border-t border-slate-100">
                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>

                      {/* Spare Part */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                        {t.sparePart?.spareName}
                      </td>

                      {/* Type */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <TransactionTypeBadge type={t.type} />
                      </td>

                      {/* Quantity */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.toId ? "+" : "-"}
                        {t.quantity}
                      </td>

                      {/* Job */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.job?.complaintNumber || "—"}
                      </td>

                      {/* Note */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <span
                          className="block max-w-[220px] truncate"
                          title={t.note || ""}>
                          {t.note || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
