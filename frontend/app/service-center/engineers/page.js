"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, Phone, IdCard, LogIn } from "lucide-react";
import {
  getServiceEngineers,
  loginServiceEngineer,
} from "@/actions/service-center";
import Swal from "sweetalert2";
import { useAuthStore } from "@/features/Useauthstore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function ServiceEngineersPage() {
  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const fetchEngineers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await getServiceEngineers();
      setEngineers(data?.data ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't load service engineers.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  const filtered = useMemo(() => {
    return engineers.filter((eng) => {
      const matchesSearch =
        !search ||
        eng.name?.toLowerCase().includes(search.toLowerCase()) ||
        eng.username?.toLowerCase().includes(search.toLowerCase()) ||
        eng.contactNumber?.includes(search);
      const matchesStatus =
        statusFilter === "All" || eng.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [engineers, search, statusFilter]);

  const handleChangeAccount = async (id, name) => {
    if (!id || !name) {
      toast.error("engineer ID / engineer name is missing");
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
          const { data } = await loginServiceEngineer(id);
          if (data.success) {
            setAuth({ token: data.token, user: data.engineer });
            toast.success("Login successful");
            router.push("/service-engineer");
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
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
          Team
        </p>
        <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
          Service Engineers
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Engineers assigned to your service center.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username or number..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        {(search || statusFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchEngineers}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && <TableSkeleton />}

      {/* Desktop table */}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    S.No.
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Name
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Contact Number
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Aadhar Number
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Username
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((eng, index) => (
                  <tr
                    key={eng._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    {/* S.No. */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                      {index + 1}
                    </td>

                    {/* Name */}
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900">
                      {eng.name}
                    </td>

                    {/* Contact Number */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {eng.contactNumber || "—"}
                    </td>

                    {/* Aadhar Number */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {eng.aadharNumber || "—"}
                    </td>

                    {/* Username */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      @{eng.username}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge status={eng.status} />
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <button
                        onClick={() => handleChangeAccount(eng._id, eng.name)}
                        type="button"
                        title="Login as this service engineer"
                        className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-electric-500/10 hover:text-electric-500">
                        <LogIn size={17} strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="whitespace-nowrap px-4 py-10 text-center text-sm text-slate-400">
                      No service engineers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
