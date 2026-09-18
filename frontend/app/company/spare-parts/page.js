"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSpareParts,
  deleteSparePart,
  getAllSparePartTransactions,
  getSparePartStockByCenter,
} from "@/actions/company";
import RestockModal from "@/components/spare-parts/RestockModal";
import AllocateModal from "@/components/spare-parts/AllocateModal";

const TABS = [
  { key: "stock", label: "Central Store" },
  { key: "byCenter", label: "By Service Center" }, // NEW
  { key: "history", label: "Usage History" },
];

function TransactionTypeBadge({ type }) {
  const styles = {
    Allocate: "bg-electric-500/10 text-black",
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

export default function SparePartsPage() {
  const [tab, setTab] = useState("stock");
  const [parts, setParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [restockTarget, setRestockTarget] = useState(null);
  const [allocateTarget, setAllocateTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [byCenter, setByCenter] = useState([]);

  // add a load function:
  async function loadByCenter() {
    setLoading(true);
    setError("");
    try {
      const res = await getSparePartStockByCenter({
        search: search || undefined,
      });
      setByCenter(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load stock by center", err);
      setError("Failed to load stock by center.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStock() {
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

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const res = await getAllSparePartTransactions({
        search: search || undefined,
      });

      setTransactions(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load transaction history", err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (tab === "stock") loadStock();
        else if (tab === "byCenter") loadByCenter();
        else loadHistory();
      },
      search ? 350 : 0,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab]);

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

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, product or model number"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      {tab === "stock" && (
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
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                        {p.spareName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {p.brand} / {p.product}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {p.modelNumber || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`font-semibold ${p.companyStock === 0 ? "text-red-500" : "text-navy-900"}`}>
                          {p.companyStock} {p.unit}
                        </span>
                      </td>
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
                  <th className="whitespace-nowrap px-4 py-3">From</th>
                  <th className="whitespace-nowrap px-4 py-3">To</th>
                  <th className="whitespace-nowrap px-4 py-3">Quantity</th>
                  <th className="whitespace-nowrap px-4 py-3">Job</th>
                  <th className="whitespace-nowrap px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="whitespace-nowrap px-4 py-6 text-center text-slate-400">
                      No activity yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                        {t.sparePart?.spareName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TransactionTypeBadge type={t.type} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.fromType === "Company"
                          ? "Company"
                          : t.fromId?.name || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.toType === "Company"
                          ? "Company"
                          : t.toId?.name || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t.job?.complaintNumber || "—"}
                      </td>
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

      {tab === "byCenter" &&
        (() => {
          const grouped = byCenter.reduce((acc, row) => {
            const centerName = row.ownerId?.name || "Unknown Center";
            if (!acc[centerName]) acc[centerName] = [];
            acc[centerName].push(row);
            return acc;
          }, {});
          const centerNames = Object.keys(grouped).sort((a, b) =>
            a.localeCompare(b),
          );

          if (loading) {
            return <p className="text-sm text-slate-400">Loading…</p>;
          }
          if (centerNames.length === 0) {
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400 shadow-sm shadow-slate-200/50">
                No spare parts allocated to any service center yet.
              </div>
            );
          }

          return (
            <div className="space-y-5">
              {centerNames.map((centerName) => {
                const rows = grouped[centerName];
                const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);
                return (
                  <div
                    key={centerName}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                      <h3 className="text-sm font-semibold text-navy-900">
                        {centerName}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {rows.length} part{rows.length !== 1 ? "s" : ""} ·{" "}
                        {totalUnits} units total
                      </span>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-max text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="whitespace-nowrap px-4 py-2.5">
                              Spare Name
                            </th>
                            <th className="whitespace-nowrap px-4 py-2.5">
                              Brand / Product
                            </th>
                            <th className="whitespace-nowrap px-4 py-2.5">
                              Model No.
                            </th>
                            <th className="whitespace-nowrap px-4 py-2.5">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr
                              key={r._id}
                              className="border-t border-slate-100">
                              <td className="whitespace-nowrap px-4 py-2.5 font-medium text-navy-900">
                                {r.sparePart?.spareName}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                                {r.sparePart?.brand} / {r.sparePart?.product}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                                {r.sparePart?.modelNumber || "—"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5">
                                <span
                                  className={`font-semibold ${r.quantity === 0 ? "text-red-500" : "text-navy-900"}`}>
                                  {r.quantity} {r.sparePart?.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      <RestockModal
        open={!!restockTarget}
        sparePart={restockTarget}
        onClose={() => setRestockTarget(null)}
        onDone={loadStock}
      />
      <AllocateModal
        open={!!allocateTarget}
        sparePart={allocateTarget}
        onClose={() => setAllocateTarget(null)}
        onDone={loadStock}
      />
    </div>
  );
}
