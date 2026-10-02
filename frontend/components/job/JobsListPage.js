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

import { JOB_STATUS } from "./Constants";
import JobsTable from "./Jobstable";
import AssignJobModal from "./Assignjobmodal";
import CancelJobModal from "./Canceljobmodal";
import ViewLogsModal from "./Viewlogsmodal";
import ViewImagesModal from "./ViewImagesModal";
import Pagination from "@/components/Pagination";
import {
  getJobs,
  assignJob,
  cancelJob,
  getServiceCenters,
  getServiceEngineers,
} from "@/actions/company";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const VARIANT_STATUS_FILTER = {
  registered: JOB_STATUS.REGISTERED,
  serviceCenter: JOB_STATUS.SERVICE_CENTER_ASSIGNED,
  serviceEngineer: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
  hold: JOB_STATUS.HOLD,
  completed: JOB_STATUS.COMPLETED,
  cancelled: JOB_STATUS.CANCELLED,
  // "all" — no entry, no status lock
};

const EMPTY_PAGINATION = { total: 0, pages: 1, page: 1, limit: PAGE_SIZE };

const FILTER_KEYS = [
  "search",
  "status",
  "jobSource",
  "callType",
  "natureOfWork",
  "serviceCenter",
  "serviceEngineer",
  "dateFrom",
  "dateTo",
  "sort",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobsListPage({ variant, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Page + filters from URL -------------------------------------------
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
  const [serviceCenters, setServiceCenters] = useState([]);
  const [serviceEngineers, setServiceEngineers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // ---- Modal targets ------------------------------------------------------
  const [assignTarget, setAssignTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [logsTarget, setLogsTarget] = useState(null);
  const [imagesTarget, setImagesTarget] = useState(null);

  // ---- Cache + race guard -------------------------------------------------
  const cacheRef = useRef(new Map());
  const requestIdRef = useRef(0);

  // ---- Fetch --------------------------------------------------------------
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
        // URL status wins over variant lock.
        const variantStatus = VARIANT_STATUS_FILTER[variant];
        const status = targetFilters.status ?? variantStatus;

        const res = await getJobs({
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

  useEffect(() => {
    fetchJobs(page, filters);
  }, [fetchJobs, page, filters]);

  // Lookups once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getServiceCenters(), getServiceEngineers()])
      .then(([centersRes, engineersRes]) => {
        if (cancelled) return;
        setServiceCenters(centersRes.data?.data ?? []);
        setServiceEngineers(engineersRes.data?.data ?? []);
      })
      .catch((err) => console.error("Failed to load lookups", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- URL updater --------------------------------------------------------
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

  const handleFiltersChange = useCallback(
    (patch) => updateQuery(patch, { resetPage: true }),
    [updateQuery],
  );

  // ---- Mutations ----------------------------------------------------------
  const invalidateAndRefetch = useCallback(async () => {
    cacheRef.current.clear();
    await fetchJobs(page, filters, { bypassCache: true });
  }, [fetchJobs, page, filters]);

  async function handleAssign({ jobIds, serviceCenter, scheduleDate, note }) {
    try {
      await assignJob({ jobIds, serviceCenter, scheduleDate, note });
      setAssignTarget(null);
      await invalidateAndRefetch();
    } catch (err) {
      console.error("Failed to assign job(s)", err);
      throw err;
    }
  }

  async function handleCancel({ jobId, reason }) {
    try {
      await cancelJob(jobId, { reason });
      setCancelTarget(null);
      await invalidateAndRefetch();
    } catch (err) {
      console.error("Failed to cancel job", err);
      throw err;
    }
  }

  const showInitialSkeleton = initialLoading && jobs.length === 0;

  // ---- Render -------------------------------------------------------------
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
          <JobsTable
            title={title}
            subtitle={subtitle}
            jobs={jobs}
            variant={variant}
            serviceCenterOptions={serviceCenters}
            serviceEngineerOptions={serviceEngineers}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalCount={pagination.total}
            showStatusFilter={variant === "all"}
            onEditJob={(job) => console.log("Edit", job._id)}
            onAssignJob={(jobIds) => setAssignTarget(jobIds)}
            onViewLogs={(job) => setLogsTarget(job)}
            onCancelJob={(job) => setCancelTarget(job)}
            onViewImages={(job) => setImagesTarget(job)}
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

      <AssignJobModal
        open={!!assignTarget}
        jobIds={assignTarget ?? []}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
        serviceCenterOptions={serviceCenters}
      />
      <CancelJobModal
        open={!!cancelTarget}
        job={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelJob={handleCancel}
      />
      <ViewLogsModal
        open={!!logsTarget}
        job={logsTarget}
        onClose={() => setLogsTarget(null)}
      />
      <ViewImagesModal
        open={!!imagesTarget}
        job={imagesTarget}
        onClose={() => setImagesTarget(null)}
      />
    </div>
  );
}