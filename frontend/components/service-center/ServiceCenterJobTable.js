"use client";

import { useMemo, useState } from "react";
import {
  CALL_TYPE_OPTIONS,
  NATURE_OF_WORK_OPTIONS,
  STATUS_TONE,
  JOB_STATUS,
  JOB_STATUS_LIST,
} from "@/components/job/Constants";
import StatusBadge from "../job/Statusbadge";
import {
  Search,
  ArrowUpDown,
  Pencil,
  UserPlus,
  ScrollText,
  Ban,
  Inbox,
} from "lucide-react";

// Statuses a job can still be assigned / cancelled from, used by the "all" variant
// to decide per-row which actions make sense instead of hiding them for the whole table.
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

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto";

function computeAgingDays(complaintDate, status) {
  if (!complaintDate || status === "Completed" || status === "Cancelled")
    return null;
  const diffMs = Date.now() - new Date(complaintDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function AgingPill({ days }) {
  if (days === null || days === undefined)
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
      className={`flex ${dim} shrink-0 items-center text-black justify-center rounded-lg transition ${toneClass}`}>
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

function RowActions({
  job,
  canAssign,
  canCancel,
  onEditJob,
  onAssignJob,
  onViewLogs,
  onCancelJob,
  size = "md",
}) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton
        label="Edit Status"
        Icon={Pencil}
        size={size}
        onClick={() => onEditJob?.(job)}
      />
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Mobile/tablet card, shown below the `lg` breakpoint instead of a table row so long
 * text (customer names, reasons) can wrap without squeezing columns.
 */
function JobCard({
  job,
  showCheckbox,
  checked,
  onToggle,
  selectable,
  showHoldReason,
  showCancelReason,
  actionProps,
}) {
  const agingDays = computeAgingDays(job.complaintDate, job.status);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-900">
              {job.complaintNumber}
            </p>
            <p className="text-xs text-slate-400">
              Booked {formatShortDate(job.complaintDate)}
            </p>
          </div>
        </div>
        <StatusBadge status={job.status} tone={STATUS_TONE[job.status]} />
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Customer
          </p>
          <p className="mt-0.5 truncate font-medium text-navy-900">
            {job.customer?.name ?? "—"}
          </p>
          {job.customer?.mobileNumber && (
            <a
              href={`tel:${job.customer.mobileNumber}`}
              className="mt-0.5 inline-block text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {job.customer.mobileNumber}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Nature / Call Type
            </p>
            <p className="mt-0.5 text-sm text-navy-900">
              {job.natureOfWork || "—"}
            </p>
            <p className="text-xs text-slate-500">{job.callType}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Assigned Engineer
            </p>
            <p className="mt-0.5 break-words text-sm text-navy-900">
              {job.assignedServiceEngineer?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Schedule
            </p>
            <p className="mt-0.5 text-sm text-navy-900">
              {formatShortDate(job.scheduleDate)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Solved
            </p>
            <p className="mt-0.5 text-sm text-navy-900">
              {job.solveDate
                ? formatShortDate(job.solveDate)
                : "Not solved yet"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Aging
            </p>
            <div className="mt-1">
              <AgingPill days={agingDays} />
            </div>
          </div>
        </div>

        {showHoldReason && job.holdReason && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Reason for Hold
            </p>
            <p className="mt-0.5 break-words text-sm text-navy-900">
              {job.holdReason}
            </p>
          </div>
        )}
        {showCancelReason && job.cancelReason && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Cancellation Reason
            </p>
            <p className="mt-0.5 break-words text-sm text-navy-900">
              {job.cancelReason}
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/40 px-4 py-2.5">
        <RowActions job={job} {...actionProps} />
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
 * variant: "registered" | "serviceCenter" | "serviceEngineer" | "hold" | "completed" | "cancelled" | "all"
 * Controls which extra filter/column shows up, and which row actions are available.
 *
 * Note: this table is scoped to a single Service Center's own jobs, so there is no
 * "filter by Service Center" option — every row already belongs to the logged-in center.
 */
export default function ServiceCenterJobsTable({
  title,
  subtitle,
  jobs,
  variant = "registered",
  serviceEngineerOptions = [],
  onEditJob,
  onAssignJob,
  onViewLogs,
  onCancelJob,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [callType, setCallType] = useState("");
  const [nature, setNature] = useState("");
  const [serviceEngineer, setServiceEngineer] = useState("");
  const [selected, setSelected] = useState([]);
  const [sortDesc, setSortDesc] = useState(true);

  const isAllVariant = variant === "all";

  const showStatusFilter = isAllVariant;
  const showAssignAction = isAllVariant
    ? null
    : variant === "registered" || variant === "serviceCenter";
  const showBulkAssign = isAllVariant
    ? true
    : ["registered", "serviceCenter", "serviceEngineer", "hold"].includes(
        variant,
      );
  const showServiceEngineerFilter =
    isAllVariant || ["serviceEngineer", "hold"].includes(variant);
  const showHoldReasonColumn = isAllVariant || variant === "hold";
  const showCancelReasonColumn = isAllVariant || variant === "cancelled";
  const showCancelAction = isAllVariant ? null : variant === "registered";

  function canAssignRow(job) {
    return isAllVariant
      ? ASSIGNABLE_STATUSES.includes(job.status)
      : showAssignAction;
  }
  function canCancelRow(job) {
    return isAllVariant
      ? CANCELLABLE_STATUSES.includes(job.status)
      : showCancelAction;
  }
  function canSelectRow(job) {
    return isAllVariant ? BULK_SELECTABLE_STATUSES.includes(job.status) : true;
  }

  const filtered = useMemo(() => {
    const rows = jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job?.complaintNumber?.toLowerCase().includes(search.toLowerCase()) ||
        job?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        job?.customer?.mobileNumber?.includes(search);
      const matchesStatus = !status || job?.status === status;
      const matchesCallType = !callType || job?.callType === callType;
      const matchesNature = !nature || job?.natureOfWork === nature;
      const matchesEngineer =
        !serviceEngineer ||
        job?.assignedServiceEngineer?._id === serviceEngineer;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesCallType &&
        matchesNature &&
        matchesEngineer
      );
    });
    return rows.sort((a, b) =>
      sortDesc
        ? new Date(b.complaintDate) - new Date(a.complaintDate)
        : new Date(a.complaintDate) - new Date(b.complaintDate),
    );
  }, [jobs, search, status, callType, nature, serviceEngineer, sortDesc]);

  const selectableRows = filtered.filter(canSelectRow);
  const allSelected =
    selectableRows.length > 0 && selected.length === selectableRows.length;
  const hasActiveFilters =
    search || status || callType || nature || serviceEngineer;

  function toggleAll() {
    setSelected(allSelected ? [] : selectableRows.map((j) => j._id));
  }

  function toggleOne(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCallType("");
    setNature("");
    setServiceEngineer("");
  }

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

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            {showStatusFilter && (
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
            )}

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

            <select
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              className={selectClass}>
              <option value="">All Nature of Work</option>
              {NATURE_OF_WORK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {showServiceEngineerFilter && (
              <select
                value={serviceEngineer}
                onChange={(e) => setServiceEngineer(e.target.value)}
                className={`${selectClass} col-span-2 sm:col-span-1`}>
                <option value="">All Service Engineers</option>
                {serviceEngineerOptions.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setSortDesc((v) => !v)}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:col-span-1 sm:ml-auto sm:w-auto">
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
              {sortDesc ? "Newest first" : "Oldest first"}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-electric-600 hover:bg-electric-500/10 sm:col-span-1 sm:w-auto">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk assign bar */}
      {showBulkAssign && selected.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-electric-400/40 bg-electric-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-navy-900">
            {selected.length} job{selected.length > 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Clear
            </button>
            <button
              type="button"
              onClick={() => onAssignJob?.(selected)}
              className="rounded-lg bg-electric-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:brightness-110">
              Bulk Assign
            </button>
          </div>
        </div>
      )}

      {/* Mobile / tablet: stacked cards (below lg) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            showCheckbox={showBulkAssign}
            checked={selected.includes(job._id)}
            onToggle={() => toggleOne(job._id)}
            selectable={canSelectRow(job)}
            showHoldReason={showHoldReasonColumn}
            showCancelReason={showCancelReasonColumn}
            actionProps={{
              canAssign: canAssignRow(job),
              canCancel: canCancelRow(job),
              onEditJob,
              onAssignJob,
              onViewLogs,
              onCancelJob,
            }}
          />
        ))}
        {filtered.length === 0 && <EmptyState />}
      </div>

      {/* Desktop: table (lg and up) */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">S.No.</th>
                <th className="whitespace-nowrap px-4 py-3">Complaint No.</th>
                <th className="whitespace-nowrap px-4 py-3">Booked</th>
                <th className="whitespace-nowrap px-4 py-3">Schedule</th>
                <th className="whitespace-nowrap px-4 py-3">Solved</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Nature / Call Type</th>
                <th className="px-4 py-3">Assigned Engineer</th>
                {showHoldReasonColumn && (
                  <th className="px-4 py-3">Reason for Hold</th>
                )}
                {showCancelReasonColumn && (
                  <th className="px-4 py-3">Cancellation Reason</th>
                )}
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">Aging</th>
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
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900">
                    {job.complaintNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.complaintDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.scheduleDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    {formatShortDate(job.solveDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <p
                      className="max-w-45 truncate font-medium text-navy-900"
                      title={job.customer?.name}>
                      {job.customer?.name ?? "—"}
                    </p>
                    <p className="whitespace-nowrap text-xs text-slate-500">
                      {job.customer?.mobileNumber ?? ""}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-navy-900">{job.natureOfWork}</p>
                    <p className="text-xs text-slate-500">{job.callType}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span
                      className="block max-w-40 truncate"
                      title={job.assignedServiceEngineer?.name}>
                      {job.assignedServiceEngineer?.name ?? "—"}
                    </span>
                  </td>
                  {showHoldReasonColumn && (
                    <td className="px-4 py-3.5 text-slate-600">
                      <span
                        className="block max-w-45 truncate"
                        title={job.holdReason ?? ""}>
                        {job.holdReason ?? "—"}
                      </span>
                    </td>
                  )}
                  {showCancelReasonColumn && (
                    <td className="px-4 py-3.5 text-slate-600">
                      <span
                        className="block max-w-45 truncate"
                        title={job.cancelReason ?? ""}>
                        {job.cancelReason ?? "—"}
                      </span>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge
                      status={job.status}
                      tone={STATUS_TONE[job.status]}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <AgingPill
                      days={computeAgingDays(job.complaintDate, job.status)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center justify-end">
                      <RowActions
                        job={job}
                        canAssign={canAssignRow(job)}
                        canCancel={canCancelRow(job)}
                        onEditJob={onEditJob}
                        onAssignJob={onAssignJob}
                        onViewLogs={onViewLogs}
                        onCancelJob={onCancelJob}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
