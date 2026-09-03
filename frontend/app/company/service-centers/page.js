// app/company/service-centers/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getServiceCenters, deleteServiceCenter } from "@/actions/company";

export default function ServiceCentersPage() {
  const router = useRouter();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getServiceCenters();
      setCenters(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load service centers", err);
      setError("Failed to load service centers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(center) {
    if (!confirm(`Delete "${center.name}"? This can't be undone.`)) return;
    setDeletingId(center._id);
    try {
      await deleteServiceCenter(center._id);
      setCenters((prev) => prev.filter((c) => c._id !== center._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete service center.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">
            Service Centers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage the service centers in your network.
          </p>
        </div>
        <Link
          href="/company/service-centers/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Service Center
        </Link>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Contact Number</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : centers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400">
                  No service centers yet.
                </td>
              </tr>
            ) : (
              centers.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.contactPerson}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.contactNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        c.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/company/service-centers/${c._id}/edit`)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === c._id}
                        onClick={() => handleDelete(c)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60">
                        {deletingId === c._id ? "Deleting…" : "Delete"}
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
  );
}
