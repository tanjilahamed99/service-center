// app/admin/service-centers/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getAdminServiceCenters, getCompaniesLookup } from "@/actions/admin";

export default function AdminServiceCentersPage() {
  const [centers, setCenters] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminServiceCenters({
        company: companyFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setCenters(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load service centers", err);
      setError("Failed to load service centers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCompaniesLookup()
      .then((res) => setCompanies(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load companies", err));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0); // debounce only the free-text search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Service Centers</h2>
        <p className="mt-1 text-sm text-slate-500">
          Every service center across every company.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or username"
          className="w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:min-w-[220px]"
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Contact Number</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Status</th>
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
                  No service centers found.
                </td>
              </tr>
            ) : (
              centers.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.company?.companyName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.contactPerson || "—"}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
