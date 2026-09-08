"use client";

import { useMemo, useState } from "react";
import { Phone, MapPin } from "lucide-react";
import {
  CALL_TYPE_OPTIONS,
  NATURE_OF_WORK_OPTIONS,
  STATUS_TONE,
  JOB_STATUS_LIST,
} from "../job/Constants";
import StatusBadge from "../job/Statusbadge";
import { formatDate } from "../FormatDate";

function Icon({ d, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICONS = {
  view: "M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z M12 15a3 3 0 100-6 3 3 0 000 6z",
  status: "M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

function ActionButton({ label, iconD, onClick, tone = "slate" }) {
  const toneClass =
    tone === "electric"
      ? "text-electric-500 hover:bg-electric-500/10"
      : "text-slate-500 hover:bg-slate-100";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${toneClass}`}>
      <Icon d={ICONS[iconD]} />
    </button>
  );
}

function AgingPill({ days }) {
  if (!days) return <span className="text-sm text-slate-400">—</span>;
  const tone =
    days >= 7
      ? "text-red-500 bg-red-50"
      : days >= 3
        ? "text-amber-500 bg-amber-50"
        : "text-slate-500 bg-slate-100";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${tone}`}>
      {days} {days === 1 ? "day" : "days"}
    </span>
  );
}

function RowActions({ job, onViewJob, onUpdateStatus }) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton
        label="View Job"
        iconD="view"
        onClick={() => onViewJob?.(job)}
      />
      <ActionButton
        label="Update Status"
        iconD="status"
        tone="electric"
        onClick={() => onUpdateStatus?.(job)}
      />
    </div>
  );
}

function JobCard({ job, onViewJob, onUpdateStatus }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-navy-900">{job.complaintNumber}</p>
          <p className="text-xs text-slate-400">{job.bookDateTime}</p>
        </div>
        <StatusBadge status={job.status} tone={STATUS_TONE[job.status]} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
        <div>
          <p className="text-xs text-slate-400">Customer</p>
          <p className="text-navy-900">{job.customer?.name}</p>
          <p className="text-xs text-slate-500">{job.customer?.mobileNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Nature / Call Type</p>
          <p className="text-navy-900">{job.natureOfWork}</p>
          <p className="text-xs text-slate-500">{job.callType}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Schedule</p>
          <p className="text-navy-900">{job.scheduleDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Aging</p>
          <AgingPill days={job.agingDays} />
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <RowActions
          job={job}
          onViewJob={onViewJob}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
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
      const matchesSearch =
        !search ||
        job.complaintNumber?.toLowerCase().includes(search.toLowerCase()) ||
        job.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        job.customer?.mobileNumber?.includes(search);
      const matchesStatus = !status || job.status === status;
      const matchesCallType = !callType || job.callType === callType;
      const matchesNature = !nature || job.natureOfWork === nature;
      return matchesSearch && matchesStatus && matchesCallType && matchesNature;
    });
    return rows.sort((a, b) =>
      sortDesc
        ? b.complaintDate?.localeCompare(a.complaintDate)
        : a.complaintDate?.localeCompare(b.complaintDate),
    );
  }, [jobs, search, status, callType, nature, sortDesc]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-55 sm:flex-1">
          <Icon
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint no., customer name or number"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:contents">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
            <option value="">All Statuses</option>
            {JOB_STATUS_LIST.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={callType}
            onChange={(e) => setCallType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
            <option value="">All Call Types</option>
            {CALL_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
            <option value="">All Nature of Work</option>
            {NATURE_OF_WORK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSortDesc((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:w-auto">
          <Icon
            d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"
            className="h-4 w-4"
          />
          {sortDesc ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="space-y-3 lg:hidden">
        {filtered.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            onViewJob={onViewJob}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
            No jobs match the current filters.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="whitespace-nowrap px-4 py-3">S.No.</th>
              <th className="whitespace-nowrap px-4 py-3">Complaint No.</th>
              <th className="whitespace-nowrap px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Nature / Call Type</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              {/* <th className="whitespace-nowrap px-4 py-3">Aging</th> */}
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
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {idx + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                  {job.complaintNumber}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(job.scheduleDate)}
                </td>
                <td className="px-4 py-3">
                  {/* Customer Name */}
                  <p
                    className="max-w-[180px] truncate font-medium text-navy-900"
                    title={job.customer?.name}>
                    {job.customer?.name || "N/A"}
                  </p>

                  {/* Mobile Number */}
                  {job.customer?.mobileNumber && (
                    <a
                      href={`tel:${job.customer.mobileNumber}`}
                      className="mt-1 flex items-center gap-1 whitespace-nowrap text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
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
                      className="mt-1 flex max-w-[220px] items-center gap-1 truncate text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                      title={`Open location: ${job.customer.address}`}>
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{job.customer.address}</span>
                    </a>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-navy-900">{job.natureOfWork}</p>
                  <p className="text-xs text-slate-500">{job.callType}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge
                    status={job.status}
                    tone={STATUS_TONE[job.status]}
                  />
                </td>
                {/* <td className="whitespace-nowrap px-4 py-3"><AgingPill days={job.agingDays} /></td> */}
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center justify-end">
                    <RowActions
                      job={job}
                      onViewJob={onViewJob}
                      onUpdateStatus={onUpdateStatus}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan="100%"
                  className="px-4 py-12 text-center text-sm text-slate-400">
                  No jobs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
