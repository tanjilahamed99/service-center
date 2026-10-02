"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  serviceCenterJobs,
  assignJob,
  getServiceEngineers,
} from "@/actions/service-center";
import { JOB_STATUS } from "../job/Constants";
import ViewLogsModal from "../job/Viewlogsmodal";
import ServiceCenterJobsTable from "./ServiceCenterJobTable";
import ServiceCenterAssignJobModal from "./ServiceCenterAssignModal";
import Pagination from "../Pagination";

const PAGE_SIZE = 20;

const VARIANT_STATUS_FILTER = {
  registered: JOB_STATUS.REGISTERED,
  serviceCenter: JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  serviceEngineer: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  hold: JOB_STATUS.HOLD,
  completed: JOB_STATUS.COMPLETED,
  cancelled: JOB_STATUS.CANCELLED,
};

const EMPTY_PAGINATION = { total: 0, pages: 1, page: 1, limit: PAGE_SIZE };

// Only these keys travel to the server. Keep in sync with the API.
const FILTER_KEYS = [
  "search",
  "status",
  "jobSource",
  "callType",
  "natureOfWork",
  "serviceEngineer",
  "dateFrom",
  "dateTo",
  "sort",
];

export default function ServiceJobsListPage({ variant, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Read state from URL ------------------------------------------------
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const filters = useMemo(() => {
    const obj = {};
    for (const key of FILTER_KEYS) {
      const v = searchParams.get(key);
      if (v) obj[key] = v;
    }
    return obj;
  }, [searchParams]);

  // ---- Data state ---------------------------------------------------------
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [serviceEngineers, setServiceEngineers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // ---- Modal targets ------------------------------------------------------
  const [assignTarget, setAssignTarget] = useState(null);
  const [holdTarget, setHoldTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [logsTarget, setLogsTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // ---- Cache + race guard -------------------------------------------------
  const cacheRef = useRef(new Map());
  const requestIdRef = useRef(0);

  // ---- Fetch jobs ---------------------------------------------------------
  const fetchJobs = useCallback(
    async (targetPage, targetFilters, { bypassCache = false } = {}) => {
      const cacheKey = JSON.stringify({
        v: variant,
        p: targetPage,
        f: targetFilters,
      });

      if (!bypassCache && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey);
        setJobs(cached.jobs);
        setPagination(cached.pagination);
        setError("");
        setInitialLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setError("");

      try {
        const status = VARIANT_STATUS_FILTER[variant];
        const res = await serviceCenterJobs({
          ...(status ? { status } : {}),
          ...targetFilters,
          page: targetPage,
          limit: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        const nextJobs = res.data?.data ?? [];
        const nextPagination = res.data?.pagination ?? EMPTY_PAGINATION;

        cacheRef.current.set(cacheKey, {
          jobs: nextJobs,
          pagination: nextPagination,
        });

        setJobs(nextJobs);
        setPagination(nextPagination);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error("Failed to load jobs", err);
        setError("Failed to load jobs. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) setInitialLoading(false);
      }
    },
    [variant],
  );

  // Refetch whenever page or filters change.
  useEffect(() => {
    fetchJobs(page, filters);
  }, [fetchJobs, page, filters]);

  // Service engineers (once).
  useEffect(() => {
    let cancelled = false;
    getServiceEngineers()
      .then((res) => {
        if (!cancelled) setServiceEngineers(res.data?.data ?? []);
      })
      .catch((err) =>
        console.error("Failed to load service engineers", err),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- URL updater --------------------------------------------------------
  // Any change to filters or page => update URL. That drives the fetch.
  const updateQuery = useCallback(
    (patch, { resetPage = true } = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === "" || value == null) params.delete(key);
        else params.set(key, String(value));
      }
      if (resetPage) params.delete("page");

      startTransition(() => {
        router.push(
          params.toString() ? `${pathname}?${params}` : pathname,
          { scroll: false },
        );
      });
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = useCallback(
    (nextPage) => {
      if (nextPage === page) return;
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));

      startTransition(() => {
        router.push(
          params.toString() ? `${pathname}?${params}` : pathname,
          { scroll: false },
        );
      });
    },
    [page, pathname, router, searchParams],
  );

  // Called by the table whenever any filter control changes.
  const handleFiltersChange = useCallback(
    (patch) => updateQuery(patch, { resetPage: true }),
    [updateQuery],
  );

  // ---- Assign -------------------------------------------------------------
  const handleAssign = useCallback(
    async ({ jobIds, serviceEngineer, scheduleDate, note }) => {
      try {
        await assignJob({ jobIds, serviceEngineer, scheduleDate, note });
        setAssignTarget(null);
        cacheRef.current.clear();
        await fetchJobs(page, filters, { bypassCache: true });
      } catch (err) {
        console.error("Failed to assign job(s)", err);
        throw err;
      }
    },
    [fetchJobs, page, filters],
  );

  const showInitialSkeleton = initialLoading && jobs.length === 0;

  return (
    <div className="relative">
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchJobs(page, filters, { bypassCache: true })}
            className="font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div
        aria-busy={isPending}
        className={
          isPending
            ? "pointer-events-none opacity-60 transition-opacity duration-150"
            : "transition-opacity duration-150"
        }
      >
        {showInitialSkeleton ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-64 rounded bg-slate-200" />
            <div className="h-64 w-full rounded bg-slate-100" />
          </div>
        ) : (
          <ServiceCenterJobsTable
            title={title}
            subtitle={subtitle}
            jobs={jobs}
            variant={variant}
            serviceEngineerOptions={serviceEngineers}
            // ---- server-driven filter state + handlers ------------------
            filters={filters}
            onFiltersChange={handleFiltersChange}
            // ---- row actions -------------------------------------------
            onEditJob={setEditTarget}
            onAssignJob={setAssignTarget}
            onHoldJob={setHoldTarget}
            onViewLogs={setLogsTarget}
            onCancelJob={setCancelTarget}
            // total count comes from server, not the current page
            totalCount={pagination.total}
          />
        )}

        {pagination.pages > 1 && (
          <Pagination
            page={page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <ServiceCenterAssignJobModal
        open={!!assignTarget}
        jobIds={assignTarget ?? []}
        serviceEngineerOptions={serviceEngineers}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
      />

      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />
    </div>
  );
}