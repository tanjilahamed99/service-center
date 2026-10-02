"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  STATUS_TONE,
  JOB_STATUS,
  JOB_STATUS_LIST,
} from "@/components/job/Constants";
import StatusBadge from "../job/Statusbadge";
import {
  Search,
  ArrowUpDown,
  UserPlus,
  ScrollText,
  Inbox,
  MapPin,
  Phone,
  CalendarRange,
  X,
} from "lucide-react";
import { getJobCategoryOptions } from "@/actions/company";
import { useAuthStore } from "@/features/Useauthstore";
import DownloadExcelButton from "@/components/job/DownloadExcelButton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSIGNABLE_STATUSES = [
  JOB_STATUS.REGISTERED,
  JOB_STATUS.SERVICE_CENTER_ASSIGNED,
];

const BULK_SELECTABLE_STATUSES = [
  JOB_STATUS.REGISTERED,
  JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  JOB_STATUS.HOLD,
];

const CANCELLABLE_STATUSES = [JOB_STATUS.REGISTERED];

const TIME_ZONE = "Asia/Kolkata";

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto";

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
// Debounce hook (used only for the search box)
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
// Small subcomponents
// ---------------------------------------------------------------------------

function ActionButton({ label, Icon, onClick, tone = "slate", size = "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const toneClass =
    tone === "red"
      ? "text-red-500 hover:bg-red-50"
      : tone === "electric"
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

function RowActions({ job, onAssignJob, onViewLogs, canAssign, size = "md" }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {canAssign && (
        <ActionButton
          label="Assign Job"
          Icon={UserPlus}
          tone="electric"
          size={size}
          onClick={() => onAssignJob?.([job._id])}
        />
      )}
      <ActionButton
        label="View Logs"
        Icon={ScrollText}
        size={size}
        onClick={() => onViewLogs?.(job)}
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
            : "New complaints will appear here as they come in."}
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

/**
 * Fully controlled jobs table.
 *
 * Props
 * -----
 * title, subtitle                 → header text
 * jobs                            → array of job docs from the server (current page)
 * variant                         → "registered" | "serviceCenter" | "serviceEngineer" | "hold" | "completed" | "cancelled" | "all"
 * serviceEngineerOptions          → list of engineers for the "Assigned Engineer" filter
 * filters                         → { search, status, jobSource, callType, natureOfWork, serviceEngineer, dateFrom, dateTo, sort }
 * onFiltersChange                 → (patch) => void  — parent updates URL, refetches
 * totalCount                      → server-side total (for "X of Y jobs")
 * onEditJob, onAssignJob,
 * onViewLogs, onCancelJob         → row-level callbacks
 * hideActions                     → hide the Actions column entirely
 */
export default function ServiceCenterJobsTable({
  title,
  subtitle,
  jobs = [],
  variant = "registered",
  serviceEngineerOptions = [],
  filters = {},
  onFiltersChange,
  totalCount,
  onEditJob,
  onAssignJob,
  onViewLogs,
  onCancelJob,
  hideActions = false,
}) {
  // ---- Controlled filter values (from URL) --------------------------------
  const search = filters.search ?? "";
  const status = filters.status ?? "";
  const jobSource = filters.jobSource ?? "";
  const callType = filters.callType ?? "";
  const nature = filters.natureOfWork ?? "";
  const serviceEngineer = filters.serviceEngineer ?? "";
  const dateFrom = filters.dateFrom ?? "";
  const dateTo = filters.dateTo ?? "";
  const sortDesc = (filters.sort ?? "desc") === "desc";

  // ---- Local UI state -----------------------------------------------------
  const [selected, setSelected] = useState([]);
  const [jobSourceOptions, setJobSourceOptions] = useState([]);
  const [callTypeOptions, setCallTypeOptions] = useState([]);
  const [natureOfWorkOptions, setNatureOfWorkOptions] = useState([]);
  const user = useAuthStore((state) => state.user);

  // Debounced search input so we don't fire one request per keystroke.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const isFirstSearchSync = useRef(true);

  // Variant-driven UI
  const isAllVariant = variant === "all";
  const showStatusFilter = isAllVariant;
  const showAssignAction = isAllVariant
    ? null
    : variant === "registered" || variant === "serviceCenter";
  const showServiceEngineerFilter =
    isAllVariant || ["serviceEngineer", "hold"].includes(variant);
  const showHoldReasonColumn = isAllVariant || variant === "hold";
  const showCancelReasonColumn = isAllVariant || variant === "cancelled";
  const showCancelAction = isAllVariant ? null : variant === "registered";

  // ---- Server does the filtering; we render exactly what we were given ----
  const filtered = jobs;

  // -------------------------------------------------------------------------
  // Filter helpers
  // -------------------------------------------------------------------------
  const setFilter = (key, value) => onFiltersChange?.({ [key]: value });

  const clearFilters = () => {
    onFiltersChange?.({
      search: "",
      status: "",
      jobSource: "",
      callType: "",
      natureOfWork: "",
      serviceEngineer: "",
      dateFrom: "",
      dateTo: "",
      // preserve `sort` — user likely wants it to persist
    });
    setSearchInput("");
    setSelected([]);
  };

  const hasActiveFilters = Boolean(
    search ||
      status ||
      jobSource ||
      callType ||
      nature ||
      serviceEngineer ||
      dateFrom ||
      dateTo,
  );

  // -------------------------------------------------------------------------
  // Keep local search box in sync when URL changes externally (e.g. Clear)
  // -------------------------------------------------------------------------
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Push debounced search to the URL
  useEffect(() => {
    if (isFirstSearchSync.current) {
      isFirstSearchSync.current = false;
      return;
    }
    if (debouncedSearch !== search) {
      setFilter("search", debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // -------------------------------------------------------------------------
  // Load job category dropdown options once
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  function canAssignRow(job) {
    return isAllVariant
      ? ASSIGNABLE_STATUSES.includes(job.status)
      : Boolean(showAssignAction);
  }
  function canCancelRow(job) {
    return isAllVariant
      ? CANCELLABLE_STATUSES.includes(job.status)
      : Boolean(showCancelAction);
  }
  function canSelectRow(job) {
    return BULK_SELECTABLE_STATUSES.includes(job.status);
  }

  const selectableRows = useMemo(
    () => filtered.filter(canSelectRow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered],
  );
  const allSelected =
    selectableRows.length > 0 &&
    selected.length === selectableRows.length;

  function toggleAll() {
    setSelected(allSelected ? [] : selectableRows.map((j) => j._id));
  }

  function toggleOne(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Drop stale selections when the underlying page changes.
  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => jobs.some((j) => j._id === id)),
    );
  }, [jobs]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* ---------------- Header ---------------- */}
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

      {/* ---------------- Filter bar ---------------- */}
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
                <option value="">All Statuses</option>
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
              className={selectClass}
              aria-label="Filter by nature of work"
            >
              <option value="">All Nature of Work</option>
              {natureOfWorkOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {showServiceEngineerFilter && (
              <select
                value={serviceEngineer}
                onChange={(e) =>
                  setFilter("serviceEngineer", e.target.value)
                }
                className={`${selectClass} col-span-2 sm:col-span-1`}
                aria-label="Filter by service engineer"
              >
                <option value="">All Service Engineers</option>
                {serviceEngineerOptions.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            )}

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

            {/* Sort toggle */}
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

      {/* ---------------- Bulk assign bar ---------------- */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-electric-400/40 bg-electric-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-navy-900">
            {selected.length} job{selected.length > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onAssignJob?.(selected);
                setSelected([]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-electric-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:brightness-110"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign {selected.length} to Engineer
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Table ---------------- */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={selectableRows.length === 0}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-400 disabled:opacity-30"
                  />
                </th>
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
                <th className="whitespace-nowrap px-4 py-3">
                  Assigned Engineer
                </th>

                {showHoldReasonColumn && (
                  <th className="whitespace-nowrap px-4 py-3">
                    Reason for Hold
                  </th>
                )}

                {showCancelReasonColumn && (
                  <th className="whitespace-nowrap px-4 py-3">
                    Cancellation Reason
                  </th>
                )}

                <th className="whitespace-nowrap px-4 py-3">Status</th>

                {!hideActions && (
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filtered.map((job, idx) => (
                <tr
                  key={job._id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  {/* Select */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(job._id)}
                      onChange={() => toggleOne(job._id)}
                      disabled={!canSelectRow(job)}
                      aria-label={`Select job ${job._id}`}
                      className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-400 disabled:opacity-30"
                    />
                  </td>

                  {/* S.No. */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {idx + 1}
                  </td>

                  {/* Complaint Id */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900">
                    SL{job._id.slice(-5)}
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

                  {/* Remark */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.remark || "—"}</p>
                  </td>

                  {/* Brand */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.brand || "—"}</p>
                  </td>

                  {/* Product */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.product || "—"}</p>
                  </td>

                  {/* Model */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.modelNumber || "—"}</p>
                  </td>

                  {/* Serial */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.serialNumber || "—"}</p>
                  </td>

                  {/* Warranty */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">
                      {computeWarrantyLabel(job.warrantyTo)}
                    </p>
                  </td>

                  {/* Nature / Call Type */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.natureOfWork || "—"}</p>
                    <p className="text-xs text-slate-500">
                      {job.callType || "—"}
                    </p>
                  </td>

                  {/* Assigned Engineer */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    <span
                      className="block max-w-40 truncate"
                      title={job.assignedServiceEngineer?.name}
                    >
                      {job.assignedServiceEngineer?.name ||
                        (variant === "serviceCenter" ? user?.name ?? "—" : "—")}
                    </span>
                  </td>

                  {showHoldReasonColumn && (
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      <span
                        className="block max-w-45 truncate"
                        title={job.holdReason ?? ""}
                      >
                        {job.holdReason ?? "—"}
                      </span>
                    </td>
                  )}

                  {showCancelReasonColumn && (
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      <span
                        className="block max-w-45 truncate"
                        title={job.cancelReason ?? ""}
                      >
                        {job.cancelReason ?? "—"}
                      </span>
                    </td>
                  )}

                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge
                      status={job.status}
                      tone={STATUS_TONE[job.status]}
                    />
                  </td>

                  {/* Actions */}
                  {!hideActions && (
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <RowActions
                        job={job}
                        canAssign={canAssignRow(job)}
                        onAssignJob={onAssignJob}
                        onViewLogs={onViewLogs}
                        size="sm"
                      />
                    </td>
                  )}
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