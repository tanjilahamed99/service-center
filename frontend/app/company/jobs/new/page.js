"use client";

import { useEffect, useMemo, useState } from "react";
import {
  JOB_SOURCE_OPTIONS,
  CALL_TYPE_OPTIONS,
  NATURE_OF_WORK_OPTIONS,
  BRANDS,
  PRODUCTS_BY_BRAND,
} from "@/components/job/Constants";
import AddCustomerModal from "@/components/job/AddCustomerModal";
import {
  searchCustomers,
  createCustomer,
  getCustomerPreviousJobs,
  getServiceCenters,
  createJob,
} from "@/actions/company"; // adjust path to wherever your axios service file lives
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TODAY = new Date().toISOString().slice(0, 10);

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 disabled:text-slate-400";

export default function CreateJobPage() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  const [customer, setCustomer] = useState(null);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [showPreviousJobs, setShowPreviousJobs] = useState(false);
  const [previousJobs, setPreviousJobs] = useState([]);
  const [loadingPreviousJobs, setLoadingPreviousJobs] = useState(false);
  const router = useRouter();

  const [serviceCenters, setServiceCenters] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    jobSource: "",
    complaintDate: TODAY,
    brand: "",
    product: "",
    modelNumber: "",
    serialNumber: "",
    warrantyFrom: "",
    warrantyTo: "",
    callType: "",
    approxCost: "",
    assignTo: "", // holds a ServiceCenter _id
    scheduleDate: "",
    natureOfWork: "",
    file: null,
  });

  // ---- Load service centers once, for the "Assign To" dropdown ----
  useEffect(() => {
    let active = true;
    getServiceCenters()
      .then((res) => {
        if (active) setServiceCenters(res.data?.data ?? []);
      })
      .catch((err) => console.error("Failed to load service centers", err));
    return () => {
      active = false;
    };
  }, []);

  // ---- Debounced customer search against the backend ----
  useEffect(() => {
    if (!customerSearch || customer) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    const timeout = setTimeout(() => {
      searchCustomers(customerSearch)
        .then((res) => setCustomerResults(res.data?.data ?? []))
        .catch((err) => console.error("Customer search failed", err))
        .finally(() => setSearchingCustomers(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [customerSearch, customer]);

  const productOptions = form.brand
    ? (PRODUCTS_BY_BRAND[form.brand] ?? [])
    : [];

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSelectCustomer(c) {
    setCustomer(c);
    setCustomerSearch("");
    setCustomerResults([]);
    setShowPreviousJobs(false);
    setPreviousJobs([]);
  }

  async function handleAddCustomer(newCustomer) {
    try {
      const res = await createCustomer(newCustomer);
      setCustomer(res.data?.data ?? null);
      setAddCustomerOpen(false);
    } catch (err) {
      console.error("Failed to create customer", err);
      // surface to the modal however it expects errors — e.g. a toast
    }
  }

  async function togglePreviousJobs() {
    const next = !showPreviousJobs;
    setShowPreviousJobs(next);
    if (next && customer && previousJobs.length === 0) {
      setLoadingPreviousJobs(true);
      try {
        const res = await getCustomerPreviousJobs(customer._id);
        setPreviousJobs(res.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load previous jobs", err);
      } finally {
        setLoadingPreviousJobs(false);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customer) {
      setSubmitError("Select or add a customer first.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      // NOTE: `file` isn't sent — wire up an upload endpoint that returns a
      // URL, then pass that URL as `uploadFile` here.
      const payload = {
        customer: customer._id,
        jobSource: form.jobSource,
        complaintDate: form.complaintDate,
        callType: form.callType,
        natureOfWork: form.natureOfWork,
        approxCost: form.approxCost || undefined,
        brand: form.brand,
        product: form.product,
        modelNumber: form.modelNumber,
        serialNumber: form.serialNumber,
        warrantyFrom: form.warrantyFrom || undefined,
        warrantyTo: form.warrantyTo || undefined,
        assignedServiceCenter: form.assignTo || undefined,
        scheduleDate: form.scheduleDate || undefined,
      };
      const { data } = await createJob(payload);

      if (data.success) {
        toast.success("job created successful");
        router.push("/company/jobs");
      }
    } catch (err) {
      console.error("Failed to create job", err);
      setSubmitError(
        err.response?.data?.message || "Failed to create job. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-navy-900">Create Job</h2>
        <p className="text-sm text-slate-500">
          Register a new complaint and route it to a service center.
        </p>
      </div>

      {/* Customer */}
      <SectionCard
        title="Customer"
        subtitle="Search an existing customer or add a new one.">
        {!customer ? (
          <div className="sm:col-span-2 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by customer name or mobile number"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <button
                type="button"
                onClick={() => setAddCustomerOpen(true)}
                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-electric-400/40 bg-electric-500/10 px-4 py-2 text-sm font-semibold text-electric-500 hover:bg-electric-500/15">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Add New Customer
              </button>
            </div>

            {searchingCustomers && (
              <p className="text-xs text-slate-400">Searching…</p>
            )}

            {customerResults.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {customerResults.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50">
                    <span>
                      <span className="font-medium text-navy-900">
                        {c.name}
                      </span>
                      <span className="ml-2 text-slate-400">
                        {c.mobileNumber}
                      </span>
                    </span>
                    <span className="text-xs text-electric-500">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="sm:col-span-2 flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-navy-900">{customer.name}</p>
              <p className="text-sm text-slate-500">{customer.mobileNumber}</p>
              {customer.address && (
                <p className="mt-1 text-sm text-slate-400">
                  {customer.address}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreviousJobs}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Previous Jobs
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomer(null);
                  setShowPreviousJobs(false);
                  setPreviousJobs([]);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Change
              </button>
            </div>
          </div>
        )}

        {customer && showPreviousJobs && (
          <div className="sm:col-span-2 overflow-hidden rounded-lg border border-slate-200">
            {loadingPreviousJobs ? (
              <p className="px-4 py-3 text-sm text-slate-400">Loading…</p>
            ) : previousJobs.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">
                No previous jobs for this customer.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Complaint No.</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previousJobs.map((job) => (
                    <tr key={job._id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-navy-900">
                        {job.complaintNumber}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {new Date(job.complaintDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {job.product}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{job.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </SectionCard>

      {/* Job details */}
      <SectionCard title="Job Details">
        <Field label="Job Source">
          <select
            required
            value={form.jobSource}
            onChange={(e) => update("jobSource", e.target.value)}
            className={inputClass}>
            <option value="">Select source</option>
            {JOB_SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Complaint No.">
          <input
            disabled
            value="Auto-generated on save"
            className={inputClass}
          />
        </Field>
        <Field label="Complaint Date">
          <input
            type="date"
            value={form.complaintDate}
            onChange={(e) => update("complaintDate", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Call Type">
          <select
            required
            value={form.callType}
            onChange={(e) => update("callType", e.target.value)}
            className={inputClass}>
            <option value="">Select call type</option>
            {CALL_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nature of Work">
          <select
            required
            value={form.natureOfWork}
            onChange={(e) => update("natureOfWork", e.target.value)}
            className={inputClass}>
            <option value="">Select nature of work</option>
            {NATURE_OF_WORK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Approx. Cost">
          <input
            type="number"
            min="0"
            value={form.approxCost}
            onChange={(e) => update("approxCost", e.target.value)}
            placeholder="र"
            className={inputClass}
          />
        </Field>
      </SectionCard>

      {/* Product details */}
      <SectionCard title="Product Details">
        <Field label="Brand">
          <select
            value={form.brand}
            onChange={(e) => {
              update("brand", e.target.value);
              update("product", "");
            }}
            className={inputClass}>
            <option value="">Select brand</option>
            {BRANDS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product">
          <select
            disabled={!form.brand}
            value={form.product}
            onChange={(e) => update("product", e.target.value)}
            className={inputClass}>
            <option value="">
              {form.brand ? "Select product" : "Select a brand first"}
            </option>
            {productOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model Number">
          <input
            value={form.modelNumber}
            onChange={(e) => update("modelNumber", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Serial Number">
          <input
            value={form.serialNumber}
            onChange={(e) => update("serialNumber", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Warranty From">
          <input
            type="date"
            value={form.warrantyFrom}
            onChange={(e) => update("warrantyFrom", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Warranty To">
          <input
            type="date"
            value={form.warrantyTo}
            onChange={(e) => update("warrantyTo", e.target.value)}
            className={inputClass}
          />
        </Field>
      </SectionCard>

      {/* Assignment */}
      <SectionCard title="Assignment">
        <Field label="Assign To (Service Center)">
          <select
            value={form.assignTo}
            onChange={(e) => update("assignTo", e.target.value)}
            className={inputClass}>
            <option value="">Select service center</option>
            {serviceCenters.map((sc) => (
              <option key={sc._id} value={sc._id}>
                {sc.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Schedule Date">
          <input
            type="date"
            value={form.scheduleDate}
            onChange={(e) => update("scheduleDate", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Upload File" className="sm:col-span-2">
          <input
            type="file"
            onChange={(e) => update("file", e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-electric-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-electric-500 hover:file:bg-electric-500/15"
          />
          <p className="mt-1 text-xs text-slate-400">
            File upload wiring pending — needs an upload endpoint that returns a
            URL.
          </p>
        </Field>
      </SectionCard>

      {submitError && (
        <p className="text-sm font-medium text-red-500">{submitError}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-linear-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 hover:brightness-110 disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit Job"}
        </button>
      </div>

      <AddCustomerModal
        open={isAddCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSave={handleAddCustomer}
      />
    </form>
  );
}
