"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  MapPin,
  Search,
  ArrowUpDown,
  ScrollText,
  RefreshCw,
  Inbox,
  CalendarRange,
  X,
} from "lucide-react";
import { STATUS_TONE, JOB_STATUS, JOB_STATUS_LIST } from "../job/Constants";
import StatusBadge from "../job/Statusbadge";
import { getJobCategoryOptions } from "@/actions/company";
import DownloadExcelButton from "../job/DownloadExcelButton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_ZONE = "Asia/Kolkata";

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

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

function computeWarrantyLabel(warrantyTo) {
  if (!warrantyTo) return "No warranty";
  const diffMs = new Date(warrantyTo).getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return "Out of warranty";
  return `${days} days left`;
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ActionButton({ label, Icon, onClick, tone = "slate", size = "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const toneClass =
    tone === "electric"
      ? "text-electric-600 hover:bg-electric-500/10"
      : "text-slate-500 hover:bg-slate-100 hover:text-navy-900";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg text-black transition ${toneClass}`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

function RowActions({ job, onViewJob, onUpdateStatus, size = "md" }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {job.status !== JOB_STATUS.COMPLETED &&
        job.status !== JOB_STATUS.CANCELLED && (
          <ActionButton
            label="Update Status"
            Icon={RefreshCw}
            tone="electric"
            size={size}
            onClick={() => onUpdateStatus?.(job)}
          />
        )}
      <ActionButton
        label="View Job"
        Icon={ScrollText}
        size={size}
        onClick={() => onViewJob?.(job)}
      />
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-medium text-slate-500">
          {hasFilters
            ? "No jobs match the current filters"
            : "No jobs to display"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {hasFilters
            ? "Try clearing a filter or searching a different term."
            : "New jobs assigned to you will appear here."}
        </p>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ServiceEngineerJobsTable({
  title,
  subtitle,
  jobs = [],
  variant = "serviceEngineer",
  filters = {},
  onFiltersChange,
  totalCount,
  onViewJob,
  onUpdateStatus,
  showStatusFilter: showStatusFilterProp,
}) {
  // ---- Controlled filter values ------------------------------------------
  const search = filters.search ?? "";
  const status = filters.status ?? "";
  const callType = filters.callType ?? "";
  const nature = filters.natureOfWork ?? "";
  const jobSource = filters.jobSource ?? "";
  const dateFrom = filters.dateFrom ?? "";
  const dateTo = filters.dateTo ?? "";
  const sortDesc = (filters.sort ?? "desc") === "desc";

  // ---- Local UI state ----------------------------------------------------
  const [jobSourceOptions, setJobSourceOptions] = useState([]);
  const [callTypeOptions, setCallTypeOptions] = useState([]);
  const [natureOfWorkOptions, setNatureOfWorkOptions] = useState([]);

  // Debounced search box
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const isFirstSearchSync = useRef(true);

  // Prefer explicit prop; fall back to "all" rule.
  const showStatusFilter =
    typeof showStatusFilterProp === "boolean"
      ? showStatusFilterProp
      : variant === "all";

  // Server does the filtering.
  const filtered = jobs;

  // ---- Filter helpers ----------------------------------------------------
  const setFilter = (key, value) => onFiltersChange?.({ [key]: value });

  const clearFilters = () => {
    onFiltersChange?.({
      search: "",
      status: "",
      jobSource: "",
      callType: "",
      natureOfWork: "",
      dateFrom: "",
      dateTo: "",
      // sort preserved
    });
    setSearchInput("");
  };

  const hasActiveFilters = Boolean(
    search ||
      status ||
      jobSource ||
      callType ||
      nature ||
      dateFrom ||
      dateTo,
  );

  // Keep search box in sync when URL changes externally.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Push debounced search to URL.
  useEffect(() => {
    if (isFirstSearchSync.current) {
      isFirstSearchSync.current = false;
      return;
    }
    if (debouncedSearch !== search) setFilter("search", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // ---- Category options --------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getJobCategoryOptions("JobSource"),
      getJobCategoryOptions("CallType"),
      getJobCategoryOptions("NatureOfWork"),
    ])
      .then(([source, ct, natureRes]) => {
        if (cancelled) return;
        setJobSourceOptions(source.data?.data ?? []);
        setCallTypeOptions(ct.data?.data ?? []);
        setNatureOfWorkOptions(natureRes.data?.data ?? []);
      })
      .catch((err) =>
        console.error("Failed to load job category options", err),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Render ------------------------------------------------------------
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
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-navy-900">
              {filtered.length}
            </span>{" "}
            of {typeof totalCount === "number" ? totalCount : filtered.length}{" "}
            jobs
          </p>
          <DownloadExcelButton
            jobs={filtered}
            filename={(title || "jobs").toLowerCase().replace(/\s+/g, "-")}
          />
        </div>
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search complaint no., customer name or number"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-navy-900 placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            {showStatusFilter && (
              <select
                value={status}
                onChange={(e) => setFilter("status", e.target.value)}
                className={selectClass}
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                {JOB_STATUS_LIST?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            <select
              value={jobSource}
              onChange={(e) => setFilter("jobSource", e.target.value)}
              className={selectClass}
              aria-label="Filter by job source"
            >
              <option value="">All Job Sources</option>
              {jobSourceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={callType}
              onChange={(e) => setFilter("callType", e.target.value)}
              className={selectClass}
              aria-label="Filter by call type"
            >
              <option value="">All Call Types</option>
              {callTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={nature}
              onChange={(e) => setFilter("natureOfWork", e.target.value)}
              className={`${selectClass} col-span-2 sm:col-span-1`}
              aria-label="Filter by nature of work"
            >
              <option value="">All Nature of Work</option>
              {natureOfWorkOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Date range */}
            <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 sm:col-span-1 sm:w-auto">
              <CalendarRange
                className="h-4 w-4 shrink-0 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                max={dateTo || undefined}
                aria-label="From date"
                className="w-[120px] border-none bg-transparent p-0 text-sm font-medium text-navy-900 focus:outline-none focus:ring-0"
              />
              <span className="text-slate-300">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                min={dateFrom || undefined}
                aria-label="To date"
                className="w-[120px] border-none bg-transparent p-0 text-sm font-medium text-navy-900 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Sort */}
            <button
              type="button"
              onClick={() => setFilter("sort", sortDesc ? "asc" : "desc")}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-slate-50 sm:col-span-1 sm:ml-auto sm:w-auto"
            >
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
              {sortDesc ? "Newest first" : "Oldest first"}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-electric-600 hover:bg-electric-500/10 sm:col-span-1 sm:w-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">S.No.</th>
                <th className="whitespace-nowrap px-4 py-3">Complaint Id</th>
                <th className="whitespace-nowrap px-4 py-3">Booked</th>
                <th className="whitespace-nowrap px-4 py-3">Schedule</th>
                <th className="whitespace-nowrap px-4 py-3">Solved</th>
                <th className="whitespace-nowrap px-4 py-3">Customer</th>
                <th className="whitespace-nowrap px-4 py-3">Remark</th>
                <th className="whitespace-nowrap px-4 py-3">Brand</th>
                <th className="whitespace-nowrap px-4 py-3">Product</th>
                <th className="whitespace-nowrap px-4 py-3">Model</th>
                <th className="whitespace-nowrap px-4 py-3">Serial number</th>
                <th className="whitespace-nowrap px-4 py-3">Warranty</th>
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
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {idx + 1}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900">
                    SL{job._id.slice(-5)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.complaintDate)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.scheduleDate)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatDateTime(job.solveDate)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="max-w-[220px]">
                      <p
                        className="truncate font-medium text-navy-900"
                        title={job.customer?.name}
                      >
                        {job.customer?.name || "N/A"}
                      </p>

                      {job.customer?.mobileNumber && (
                        <a
                          href={`tel:${job.customer.mobileNumber}`}
                          className="mt-1 flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          title={`Call ${job.customer.mobileNumber}`}
                        >
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

                      {job.customer?.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            job.customer.address,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex max-w-[220px] items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          title={`Open location: ${job.customer.address}`}
                        >
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

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.remark || "—"}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.brand || "—"}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.product || "—"}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.modelNumber || "—"}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.serialNumber || "—"}</p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">
                      {computeWarrantyLabel(job.warrantyTo)}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.natureOfWork || "—"}</p>
                    <p className="text-xs text-slate-500">
                      {job.callType || "—"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge
                      status={job.status}
                      tone={STATUS_TONE[job.status]}
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5">
                    <RowActions
                      job={job}
                      onViewJob={onViewJob}
                      onUpdateStatus={onUpdateStatus}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-4 py-16">
              <EmptyState
                hasFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}