"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  MapPin,
  Search,
  ArrowUpDown,
  Eye,
  RefreshCw,
  Inbox,
  ScrollText,
} from "lucide-react";
import {
  CALL_TYPE_OPTIONS,
  NATURE_OF_WORK_OPTIONS,
  STATUS_TONE,
  JOB_STATUS_LIST,
} from "../job/Constants";
import StatusBadge from "../job/Statusbadge";

const TIME_ZONE = "Asia/Kolkata";

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto";

function AgingPill({ days }) {
  if (!days && days !== 0)
    return <span className="text-sm text-slate-400">—</span>;
  const tone =
    days >= 7
      ? "text-red-600 bg-red-50 ring-1 ring-inset ring-red-100"
      : days >= 3
        ? "text-amber-600 bg-amber-50 ring-1 ring-inset ring-amber-100"
        : "text-slate-600 bg-slate-100 ring-1 ring-inset ring-slate-200";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>
      {days} {days === 1 ? "day" : "days"}
    </span>
  );
}

function RowActions({ job, onViewJob, onUpdateStatus, size = "md", status }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="flex items-center gap-1.5">
      {status !== "Completed" && (
        <button
          type="button"
          onClick={() => onUpdateStatus?.(job)}
          title="Update Status"
          aria-label="Update Status"
          className={`flex ${dim} shrink-0 items-center text-black justify-center rounded-lg text-electric-600 transition hover:bg-electric-500/10`}>
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onViewJob?.(job)}
        title="View Job"
        aria-label="View Job"
        className={`flex ${dim} shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy-900`}>
        <ScrollText className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function JobCard({ job, onViewJob, onUpdateStatus }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-900">
            {job.complaintNumber}
          </p>

          <p className="text-xs text-slate-400">
            {formatShortDate(job.scheduleDate)}
          </p>
        </div>

        <StatusBadge status={job.status} tone={STATUS_TONE[job.status]} />
      </div>

      {/* Main Content */}
      <div className="space-y-3 px-4 py-3.5">
        {/* Customer */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Customer
          </p>

          <p className="mt-0.5 truncate font-medium text-navy-900">
            {job.customer?.name || "N/A"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* Phone */}
            {job.customer?.mobileNumber && (
              <a
                href={`tel:${job.customer.mobileNumber}`}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                title={`Call ${job.customer.mobileNumber}`}>
                <Phone size={13} />
                {job.customer.mobileNumber}
              </a>
            )}

            {/* Address */}
            {job.customer?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  job.customer.address,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                title={`Open location: ${job.customer.address}`}>
                <MapPin size={13} className="shrink-0" />

                <span className="truncate">{job.customer.address}</span>
              </a>
            )}
          </div>
        </div>

        {/* Job Information */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          {/* Nature of Work */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Nature of Work
            </p>

            <p className="mt-0.5 text-sm text-navy-900">
              {job.natureOfWork || "—"}
            </p>
          </div>

          {/* Call Type */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Call Type
            </p>

            <p className="mt-0.5 text-sm text-navy-900">
              {job.callType || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/40 px-4 py-2.5">
        <RowActions
          job={job}
          onViewJob={onViewJob}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-500">
        No jobs match the current filters
      </p>
      <p className="text-xs text-slate-400">
        Try clearing a filter or searching a different term.
      </p>
    </div>
  );
}

/**
 * Read-mostly table for the Service Engineer role: no bulk-select, no
 * assign/cancel — just filter/search, view, and update status.
 */
export default function ServiceEngineerJobsTable({
  title,
  subtitle,
  jobs,
  onViewJob,
  onUpdateStatus,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [callType, setCallType] = useState("");
  const [nature, setNature] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const rows = jobs.filter((job) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        job.complaintNumber?.toLowerCase().includes(searchValue) ||
        job.customer?.name?.toLowerCase().includes(searchValue) ||
        job.customer?.mobileNumber?.includes(search);

      const matchesStatus = !status || job.status === status;

      const matchesCallType = !callType || job.callType === callType;

      const matchesNature = !nature || job.natureOfWork === nature;

      return matchesSearch && matchesStatus && matchesCallType && matchesNature;
    });

    return rows.sort((a, b) => {
      const dateA = a.complaintDate || "";
      const dateB = b.complaintDate || "";

      return sortDesc ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [jobs, search, status, callType, nature, sortDesc]);

  const hasActiveFilters = status || callType || nature || search;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">{title}</h2>

          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <p className="text-sm text-slate-400">
          <span className="font-semibold text-navy-900">{filtered.length}</span>{" "}
          of {jobs.length} jobs
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaint no., customer name or number"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}>
              <option value="">All Statuses</option>

              {JOB_STATUS_LIST.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Call Type */}
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className={selectClass}>
              <option value="">All Call Types</option>

              {CALL_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Nature */}
            <select
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              className={`${selectClass} col-span-2 sm:col-span-1`}>
              <option value="">All Nature of Work</option>

              {NATURE_OF_WORK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Sort */}
            <button
              type="button"
              onClick={() => setSortDesc((v) => !v)}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:col-span-1 sm:ml-auto sm:w-auto">
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />

              {sortDesc ? "Newest first" : "Oldest first"}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setCallType("");
                  setNature("");
                }}
                className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-electric-600 hover:bg-electric-500/10 sm:col-span-1 sm:w-auto">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            onViewJob={onViewJob}
            onUpdateStatus={onUpdateStatus}
          />
        ))}

        {filtered.length === 0 && <EmptyState />}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">S.No.</th>

                <th className="whitespace-nowrap px-4 py-3">Complaint No.</th>

                <th className="whitespace-nowrap px-4 py-3">Booked</th>

                <th className="whitespace-nowrap px-4 py-3">Schedule</th>

                <th className="whitespace-nowrap px-4 py-3">Solved</th>

                <th className="px-4 py-3">Customer</th>

                <th className="px-4 py-3">Nature / Call Type</th>

                <th className="whitespace-nowrap px-4 py-3">Status</th>

                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((job, idx) => (
                <tr
                  key={job._id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  {/* S.No. */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {idx + 1}
                  </td>

                  {/* Complaint Number */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900">
                    {job.complaintNumber}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.complaintDate)}
                  </td>

                  {/* Schedule */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.scheduleDate)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.solveDate)}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    <p
                      className="max-w-[180px] truncate font-medium text-navy-900"
                      title={job.customer?.name}>
                      {job.customer?.name || "N/A"}
                    </p>

                    {/* Phone */}
                    {job.customer?.mobileNumber && (
                      <a
                        href={`tel:${job.customer.mobileNumber}`}
                        className="mt-1 flex items-center gap-1 whitespace-nowrap text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                        title={`Call ${job.customer.mobileNumber}`}>
                        <Phone size={13} strokeWidth={1.75} />

                        {job.customer.mobileNumber}
                      </a>
                    )}

                    {/* Address / Google Maps */}
                    {job.customer?.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          job.customer.address,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex max-w-[220px] items-center gap-1 truncate text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                        title={`Open location: ${job.customer.address}`}>
                        <MapPin
                          size={13}
                          strokeWidth={1.75}
                          className="shrink-0"
                        />

                        <span className="truncate">{job.customer.address}</span>
                      </a>
                    )}
                  </td>

                  {/* Nature / Call Type */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.natureOfWork || "—"}</p>

                    <p className="text-xs text-slate-500">
                      {job.callType || "—"}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge
                      status={job.status}
                      tone={STATUS_TONE[job.status]}
                    />
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center justify-end">
                      <RowActions
                        job={job}
                        onViewJob={onViewJob}
                        onUpdateStatus={onUpdateStatus}
                        size="sm"
                        status={job.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="px-4 py-16">
              <EmptyState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
