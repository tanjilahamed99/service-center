// app/company/spare-parts/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSpareParts, deleteSparePart } from "@/actions/company";
import RestockModal from "@/components/spare-parts/RestockModal";
import AllocateModal from "@/components/spare-parts/AllocateModal";

export default function SparePartsPage() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [restockTarget, setRestockTarget] = useState(null);
  const [allocateTarget, setAllocateTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getSpareParts({ search: search || undefined });
      setParts(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load spare parts", err);
      setError("Failed to load spare parts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleDelete(part) {
    if (!confirm(`Delete "${part.spareName}"? This can't be undone.`)) return;
    setDeletingId(part._id);
    try {
      await deleteSparePart(part._id);
      setParts((prev) => prev.filter((p) => p._id !== part._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete spare part.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">Spare Parts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your central store — add parts here, then allocate them to service
            centers.
          </p>
        </div>
        <Link
          href="/company/spare-parts/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Spare Part
        </Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, product or model number"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="w-full overflow-x-auto">
          <table className="min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Spare Name</th>

                <th className="whitespace-nowrap px-4 py-3">Brand / Product</th>

                <th className="whitespace-nowrap px-4 py-3">Model No.</th>

                <th className="whitespace-nowrap px-4 py-3">
                  In Central Store
                </th>

                <th className="whitespace-nowrap px-4 py-3">Status</th>

                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Actions
                </th>
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
              ) : parts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                    No spare parts yet.
                  </td>
                </tr>
              ) : (
                parts.map((p) => (
                  <tr key={p._id} className="border-t border-slate-100">
                    {/* Spare Name */}
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                      {p.spareName}
                    </td>

                    {/* Brand / Product */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {p.brand} / {p.product}
                    </td>

                    {/* Model Number */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {p.modelNumber || "—"}
                    </td>

                    {/* Stock */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`font-semibold ${
                          p.companyStock === 0
                            ? "text-red-500"
                            : "text-navy-900"
                        }`}>
                        {p.companyStock} {p.unit}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.status === "Active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRestockTarget(p)}
                          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          Restock
                        </button>

                        <button
                          onClick={() => setAllocateTarget(p)}
                          className="whitespace-nowrap rounded-lg border border-electric-400/40 bg-electric-500/10 px-3 py-1.5 text-xs font-semibold text-electric-500 hover:bg-electric-500/15">
                          Allocate
                        </button>

                        <button
                          disabled={deletingId === p._id}
                          onClick={() => handleDelete(p)}
                          className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60">
                          {deletingId === p._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RestockModal
        open={!!restockTarget}
        sparePart={restockTarget}
        onClose={() => setRestockTarget(null)}
        onDone={load}
      />
      <AllocateModal
        open={!!allocateTarget}
        sparePart={allocateTarget}
        onClose={() => setAllocateTarget(null)}
        onDone={load}
      />
    </div>
  );
}
