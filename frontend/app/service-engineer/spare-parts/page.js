"use client";

import { useEffect, useState } from "react";
import { serviceEngineerGetMySparePartStock } from "@/actions/service-engineer";

export default function ServiceEngineerSparePartsPage() {
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    serviceEngineerGetMySparePartStock()
      .then((res) => setStock(res.data?.data ?? []))
      .catch((err) => {
        console.error("Failed to load spare part stock", err);
        setError("Failed to load spare parts.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = stock.filter((s) => {
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
          What's currently available at your service center. Select parts when you mark a job Completed.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, product or model number"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Spare Name</th>
              <th className="px-4 py-3">Brand / Product</th>
              <th className="px-4 py-3">Model No.</th>
              <th className="px-4 py-3">Available</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No spare parts available right now.</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy-900">{s.sparePart?.spareName}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sparePart?.brand} / {s.sparePart?.product}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sparePart?.modelNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${s.quantity === 0 ? "text-red-500" : "text-navy-900"}`}>
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
  );
}