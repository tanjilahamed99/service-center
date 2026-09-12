// components/service-engineer/ServiceEngineerForm.jsx
"use client";

import { useEffect, useState } from "react";
import { getServiceCenters } from "@/actions/company";

const inputClass =
  "w-full rounded-lg border border-gray-400 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400";

const EMPTY_FORM = {
  serviceCenter: "",
  name: "",
  contactNumber: "",
  aadharNumber: "",
  username: "",
  password: "",
  status: "Active",
};

export default function ServiceEngineerForm({
  initialValues,
  mode = "create",
  submitting,
  error,
  onSubmit,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...initialValues,
    // serviceCenter may arrive populated as {_id, name} on edit — normalize to an id
    serviceCenter:
      initialValues?.serviceCenter?._id ?? initialValues?.serviceCenter ?? "",
  });
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    getServiceCenters({ status: "Active" })
      .then((res) => setCenters(res.data?.data ?? []))
      .catch((err) => console.error("Failed to load service centers", err));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (mode === "edit" && !payload.password) delete payload.password;
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Service Center
            </label>
            <select
              required
              value={form.serviceCenter}
              onChange={(e) => update("serviceCenter", e.target.value)}
              className={inputClass}>
              <option value="">Select service center</option>
              {centers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Engineer Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Contact Number
            </label>
            <input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Aadhar Number
            </label>
            <input
              value={form.aadharNumber}
              onChange={(e) => update("aadharNumber", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Username
            </label>
            <input
              required
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              {mode === "edit"
                ? "New Password (leave blank to keep current)"
                : "Password"}
            </label>
            <input
              type="password"
              required={mode === "create"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputClass}
            />
          </div>
          {mode === "edit" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className={inputClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110 disabled:opacity-60">
          {submitting
            ? "Saving…"
            : mode === "edit"
              ? "Save Changes"
              : "Create Service Engineer"}
        </button>
      </div>
    </form>
  );
}
