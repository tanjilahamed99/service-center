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

function computeAgingDays(complaintDate, status) {
  if (!complaintDate || status === "Completed" || status === "Cancelled")
    return null;
  const diffMs = Date.now() - new Date(complaintDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

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
  edit: "M16.5 4.5l3 3L7 20l-4 1 1-4 12.5-12.5z",
  assign: "M12 5v14M5 12h14",
  logs: "M4 6h16M4 12h16M4 18h10",
  cancel: "M6 6l12 12M18 6L6 18",
};

function ActionButton({ label, iconD, onClick, tone = "slate" }) {
  const toneClass =
    tone === "red"
      ? "text-red-500 hover:bg-red-50"
      : tone === "electric"
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
  if (days === null || days === undefined)
    return <span className="text-sm text-slate-400">—</span>;
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

function RowActions({
  job,
  canAssign,
  canCancel,
  onEditJob,
  onAssignJob,
  onViewLogs,
  onCancelJob,
}) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton
        label="Edit Status"
        iconD="edit"
        onClick={() => onEditJob?.(job)}
      />
      {canAssign && (
        <ActionButton
          label="Assign Job"
          iconD="assign"
          tone="electric"
          onClick={() => onAssignJob?.([job._id])}
        />
      )}
      <ActionButton
        label="View Logs"
        iconD="logs"
        onClick={() => onViewLogs?.(job)}
      />
      {canCancel && (
        <ActionButton
          label="Cancel Job"
          iconD="cancel"
          tone="red"
          onClick={() => onCancelJob?.(job)}
        />
      )}
    </div>
  );
}

/**
 * Mobile/tablet row, shown below the `lg` breakpoint instead of a table row so long
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggle}
              disabled={!selectable}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-electric-500 focus:ring-electric-400 disabled:opacity-30"
            />
          )}
          <div>
            <p className="font-medium text-navy-900">{job.complaintNumber}</p>
            <p className="text-xs text-slate-400">
              {formatShortDate(job.complaintDate)}
            </p>
          </div>
        </div>
        <StatusBadge status={job.status} tone={STATUS_TONE[job.status]} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
        <div>
          <p className="text-xs text-slate-400">Customer</p>
          <p className="text-navy-900">{job.customer?.name ?? "—"}</p>
          <p className="text-xs text-slate-500">
            {job.customer?.mobileNumber ?? ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Nature / Call Type</p>
          <p className="text-navy-900">{job.natureOfWork}</p>
          <p className="text-xs text-slate-500">{job.callType}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Assigned Engineer</p>
          <p className="break-words text-navy-900">
            {job.assignedServiceEngineer?.name ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Schedule / Solved</p>
          <p className="text-navy-900">{formatShortDate(job.scheduleDate)}</p>
          <p className="text-xs text-slate-500">
            {job.solveDate ? formatShortDate(job.solveDate) : "Not solved yet"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Aging</p>
          <AgingPill days={agingDays} />
        </div>
        {showHoldReason && job.holdReason && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">Reason for Hold</p>
            <p className="break-words text-navy-900">{job.holdReason}</p>
          </div>
        )}
        {showCancelReason && job.cancelReason && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">Cancellation Reason</p>
            <p className="break-words text-navy-900">{job.cancelReason}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <RowActions job={job} {...actionProps} />
      </div>
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

  function toggleAll() {
    setSelected(allSelected ? [] : selectableRows.map((j) => j.id));
  }

  function toggleOne(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-[220px] sm:flex-1">
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
          {showStatusFilter && (
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
          )}

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

          {showServiceEngineerFilter && (
            <select
              value={serviceEngineer}
              onChange={(e) => setServiceEngineer(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-electric-400 sm:w-auto">
              <option value="">All Service Engineers</option>
              {serviceEngineerOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
                </option>
              ))}
            </select>
          )}
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

      {/* Bulk assign bar */}
      {showBulkAssign && selected.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-electric-400/40 bg-electric-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-navy-900">
            {selected.length} job{selected.length > 1 ? "s" : ""} selected
          </p>
          <button
            type="button"
            onClick={() => onAssignJob?.(selected)}
            className="rounded-lg bg-electric-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:brightness-110">
            Bulk Assign
          </button>
        </div>
      )}

      {/* Mobile / tablet: stacked cards (below lg) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((job, idx) => (
          <JobCard
            key={idx}
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
        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
            No jobs match the current filters.
          </div>
        )}
      </div>

      {/* Desktop: table (lg and up) */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {showBulkAssign && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-400"
                  />
                </th>
              )}
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
                key={idx}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                {showBulkAssign && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(job._id)}
                      onChange={() => toggleOne(job._id)}
                      disabled={!canSelectRow(job)}
                      className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-400 disabled:opacity-30"
                    />
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {idx + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                  {job.complaintNumber}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDateTime(job.complaintDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatShortDate(job.scheduleDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDateTime(job.solveDate)}
                </td>
                <td className="px-4 py-3">
                  <p
                    className="max-w-45 truncate font-medium text-navy-900"
                    title={job.customer?.name}>
                    {job.customer?.name ?? "—"}
                  </p>
                  <p className="whitespace-nowrap text-xs text-slate-500">
                    {job.customer?.mobileNumber ?? ""}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-navy-900">{job.natureOfWork}</p>
                  <p className="text-xs text-slate-500">{job.callType}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span
                    className="block max-w-40 truncate"
                    title={job.assignedServiceEngineer?.name}>
                    {job.assignedServiceEngineer?.name ?? "—"}
                  </span>
                </td>
                {showHoldReasonColumn && (
                  <td className="px-4 py-3 text-slate-600">
                    <span
                      className="block max-w-45 truncate"
                      title={job.holdReason ?? ""}>
                      {job.holdReason ?? "—"}
                    </span>
                  </td>
                )}
                {showCancelReasonColumn && (
                  <td className="px-4 py-3 text-slate-600">
                    <span
                      className="block max-w-45 truncate"
                      title={job.cancelReason ?? ""}>
                      {job.cancelReason ?? "—"}
                    </span>
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge
                    status={job.status}
                    tone={STATUS_TONE[job.status]}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AgingPill
                    days={computeAgingDays(job.complaintDate, job.status)}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center justify-end">
                    <RowActions
                      job={job}
                      canAssign={canAssignRow(job)}
                      canCancel={canCancelRow(job)}
                      onEditJob={onEditJob}
                      onAssignJob={onAssignJob}
                      onViewLogs={onViewLogs}
                      onCancelJob={onCancelJob}
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
