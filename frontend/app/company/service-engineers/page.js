// app/company/service-engineers/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getServiceEngineers,
  deleteServiceEngineer,
  serviceEngineerLogin,
} from "@/actions/company";
import { useAuthStore } from "@/features/Useauthstore";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { LogIn } from "lucide-react";

export default function ServiceEngineersPage() {
  const router = useRouter();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getServiceEngineers();
      setEngineers(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load service engineers", err);
      setError("Failed to load service engineers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(engineer) {
    if (!confirm(`Delete "${engineer.name}"? This can't be undone.`)) return;
    setDeletingId(engineer._id);
    try {
      await deleteServiceEngineer(engineer._id);
      setEngineers((prev) => prev.filter((e) => e._id !== engineer._id));
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to delete service engineer.",
      );
    } finally {
      setDeletingId(null);
    }
  }

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
          const { data } = await serviceEngineerLogin(id);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">
            Service Engineers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage the engineers assigned to your service centers.
          </p>
        </div>
        <Link
          href="/company/service-engineers/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Service Engineer
        </Link>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Service Center</th>
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
            ) : engineers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400">
                  No service engineers yet.
                </td>
              </tr>
            ) : (
              engineers.map((e) => (
                <tr key={e._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy-900">
                    {e.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.serviceCenter?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.contactNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        e.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleChangeAccount(e._id, e.name)}
                        type="button"
                        title="Login as this company"
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-electric-500/10 hover:text-electric-500">
                        <LogIn size={17} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/company/service-engineers/${e._id}/edit`,
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === e._id}
                        onClick={() => handleDelete(e)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60">
                        {deletingId === e._id ? "Deleting…" : "Delete"}
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
