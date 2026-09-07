"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCompany, deleteCompany, loginCompany } from "@/actions/admin";
import { toast } from "sonner";
import { LogIn, Pencil, KeyRound, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useAuthStore } from "@/features/Useauthstore";
import { useRouter } from "next/navigation";

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      }`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SortIcon({ active, dir }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 transition ${
        active ? "text-electric-500" : "text-slate-300"
      } ${active && dir === "desc" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19V5M6 11l6-6 6 6"
      />
    </svg>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("companyName");
  const [sortDir, setSortDir] = useState("asc");
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await getCompany();

        if (data.success) {
          setCompanies(data.companies || []);
        } else {
          toast.error(data.message || "Failed to load companies");
        }
      } catch (error) {
        console.error("Get companies error:", error);

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while loading companies";

        toast.error(message);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    let rows = companies.filter((company) => {
      const companyName = company?.companyName || "";

      const matchesSearch = companyName
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || company?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    rows = [...rows].sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      if (sortBy === "creationDate") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();

        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      const cmp = String(aValue ?? "").localeCompare(String(bValue ?? ""));

      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [companies, search, statusFilter, sortBy, sortDir]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  // Delete company
  const handleDelete = async (companyId) => {
    if (!companyId) {
      toast.error("Company ID is missing");
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed)
        try {
          setDeletingId(companyId);

          const { data } = await deleteCompany(companyId);

          console.log(data);

          if (data.success) {
            setCompanies((prev) =>
              prev.filter((item) => item?._id !== companyId),
            );

            toast.success(data.message || "Company deleted successfully");
          } else {
            toast.error(data.message || "Failed to delete company");
          }
        } catch (error) {
          console.error("Delete company error:", error);

          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong while deleting company";

          toast.error(message);
        } finally {
          setDeletingId(null);
        }
    });
  };

  const handleChangeAccount = async (companyId, companyName) => {
    if (!companyId || !companyName) {
      toast.error("Company ID / company name is missing");
      return;
    }

    Swal.fire({
      title: "Are you sure",
      text: "You want to login ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, login!",
    }).then(async (result) => {
      if (result.isConfirmed)
        try {
          const { data } = await loginCompany(companyId);
          if (data.success) {
            setAuth({ token: data.token, user: data.company });
            toast.success("Login successful");
            router.push("/company");
          }
        } catch (error) {
          console.error("Delete company error:", error);

          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong while deleting company";

          toast.error(message);
        } finally {
        }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
            Companies
          </p>

          <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
            All Companies
          </h2>
        </div>

        <Link
          href="/admin/companies/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          <span className="text-lg leading-none">+</span>
          Add Company
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">S.No.</th>

                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("companyName")}
                    className="flex items-center gap-1 hover:text-navy-900">
                    Company Name
                    <SortIcon active={sortBy === "companyName"} dir={sortDir} />
                  </button>
                </th>

                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("creationDate")}
                    className="flex items-center gap-1 hover:text-navy-900">
                    Creation Date
                    <SortIcon
                      active={sortBy === "creationDate"}
                      dir={sortDir}
                    />
                  </button>
                </th>

                <th className="px-4 py-3 font-medium">Valid Upto</th>

                <th className="px-4 py-3 font-medium">Status</th>

                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCompanies.map((company, index) => (
                <tr
                  key={company?._id || index}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3.5 text-slate-500">{index + 1}</td>

                  <td className="px-4 py-3.5 font-medium text-navy-900">
                    {company?.companyName || "—"}
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    {formatDate(company?.creationDate)}
                  </td>

                  <td className="px-4 py-3.5 text-slate-600">
                    {formatDate(company?.subscriptionPlan?.toDate)}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={company?.status || "Inactive"} />
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Login */}
                      <button
                        onClick={() =>
                          handleChangeAccount(company._id, company.companyName)
                        }
                        type="button"
                        title="Login as this company"
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-electric-500/10 hover:text-electric-500">
                        <LogIn size={17} strokeWidth={1.75} />
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/admin/companies/edit/${company?._id}`}
                        title="Edit company"
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-electric-500/10 hover:text-electric-500">
                        <Pencil size={17} strokeWidth={1.75} />
                      </Link>

                      {/* Delete */}
                      <button
                        type="button"
                        title="Delete company"
                        onClick={() => handleDelete(company?._id)}
                        disabled={deletingId === company?._id}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                        {deletingId === company?._id ? (
                          <span className="block h-4.25 w-4.25 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                        ) : (
                          <Trash2 size={17} strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-400">
                    No companies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
