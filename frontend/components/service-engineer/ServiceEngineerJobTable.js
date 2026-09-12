"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  MapPin,
  Search,
  ArrowUpDown,
  Eye,
  RefreshCw,
  Inbox,
  ScrollText,
  CalendarRange,
} from "lucide-react";
import {
  STATUS_TONE,
  JOB_STATUS_LIST,
} from "../job/Constants";
import StatusBadge from "../job/Statusbadge";
import { getJobCategoryOptions } from "@/actions/company";

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

function toISODateInZone(value, timeZone = TIME_ZONE) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone }); // en-CA => YYYY-MM-DD
}

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
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState(""); // "YYYY-MM-DD"
  const [jobSource, setJobSource] = useState("");

  const [jobSourceOptions, setJobSourceOptions] = useState([]);
  const [callTypeOptions, setCallTypeOptions] = useState([]);
  const [natureOfWorkOptions, setNatureOfWorkOptions] = useState([]);

  const filtered = useMemo(() => {
    const rows = jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job?.complaintNumber?.toLowerCase().includes(search.toLowerCase()) ||
        job?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        job?.customer?.mobileNumber?.includes(search);
      const matchesStatus = !status || job?.status === status;
      const matchesJobSource = !jobSource || job?.jobSource === jobSource;
      const matchesCallType = !callType || job?.callType === callType;
      const matchesNature = !nature || job?.natureOfWork === nature;

      const jobDateStr = toISODateInZone(job?.complaintDate);
      const matchesDateRange =
        (!dateFrom || jobDateStr >= dateFrom) &&
        (!dateTo || jobDateStr <= dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesJobSource &&
        matchesCallType &&
        matchesNature &&
        matchesDateRange
      );
    });
    return rows.sort((a, b) =>
      sortDesc
        ? new Date(b.complaintDate) - new Date(a.complaintDate)
        : new Date(a.complaintDate) - new Date(b.complaintDate),
    );
  }, [
    jobs,
    search,
    status,
    jobSource,
    callType,
    nature,
    dateFrom,
    dateTo,
    sortDesc,
  ]);
  const hasActiveFilters =
    status || callType || nature || search || dateFrom || dateTo;

  useEffect(() => {
    Promise.all([
      getJobCategoryOptions("JobSource"),
      getJobCategoryOptions("CallType"),
      getJobCategoryOptions("NatureOfWork"),
    ])
      .then(([source, callType, nature]) => {
        setJobSourceOptions(source.data?.data ?? []);
        setCallTypeOptions(callType.data?.data ?? []);
        setNatureOfWorkOptions(nature.data?.data ?? []);
      })
      .catch((err) =>
        console.error("Failed to load job category options", err),
      );
  }, []);

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
              <option value="">All Status</option>

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

              {callTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={jobSource}
              onChange={(e) => setJobSource(e.target.value)}
              className={selectClass}>
              <option value="">All Job Source</option>

              {jobSourceOptions.map((opt) => (
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

              {natureOfWorkOptions?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Date range — filters by Booked (complaintDate), inclusive on both ends */}
            <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 sm:col-span-1 sm:w-auto">
              <CalendarRange
                className="h-4 w-4 shrink-0 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                aria-label="From date"
                className="w-[120px] border-none bg-transparent p-0 text-sm font-medium text-navy-900 focus:outline-none focus:ring-0"
              />
              <span className="text-slate-300">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                aria-label="To date"
                className="w-[120px] border-none bg-transparent p-0 text-sm font-medium text-navy-900 focus:outline-none focus:ring-0"
              />
            </div>

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
                  setJobSource("");
                  setDateTo("");
                  setDateFrom("");
                }}
                className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-black text-electric-600 hover:bg-electric-500/10 sm:col-span-1 sm:w-auto">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">S.No.</th>

                <th className="whitespace-nowrap px-4 py-3">Complaint No.</th>

                <th className="whitespace-nowrap px-4 py-3">Booked</th>

                <th className="whitespace-nowrap px-4 py-3">Schedule</th>

                <th className="whitespace-nowrap px-4 py-3">Solved</th>

                <th className="whitespace-nowrap px-4 py-3">Customer</th>

                <th className="whitespace-nowrap px-4 py-3">
                  Nature / Call Type
                </th>

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

                  {/* Booked */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.complaintDate)}
                  </td>

                  {/* Schedule */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.scheduleDate)}
                  </td>

                  {/* Solved */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.solveDate)}
                  </td>

                  {/* Customer */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="max-w-[220px]">
                      <p
                        className="truncate font-medium text-navy-900"
                        title={job.customer?.name}>
                        {job.customer?.name || "N/A"}
                      </p>

                      {/* Phone */}
                      {job.customer?.mobileNumber && (
                        <a
                          href={`tel:${job.customer.mobileNumber}`}
                          className="mt-1 flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          title={`Call ${job.customer.mobileNumber}`}>
                          <Phone
                            size={13}
                            strokeWidth={1.75}
                            className="shrink-0"
                          />

                          <span className="whitespace-nowrap">
                            {job.customer.mobileNumber}
                          </span>
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
                          className="mt-1 flex max-w-[220px] items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          title={`Open location: ${job.customer.address}`}>
                          <MapPin
                            size={13}
                            strokeWidth={1.75}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {job.customer.address}
                          </span>
                        </a>
                      )}
                    </div>
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
