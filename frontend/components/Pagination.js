// components/Pagination.jsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Generic page-number pagination bar. Works off page numbers only —
 * no knowledge of jobs/centers/engineers — so the same component drops
 * into any paginated list (company jobs, service-center jobs, engineer
 * jobs, spare parts, etc.) with just these three props.
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // Builds a compact page list like [1, '...', 4, 5, 6, '...', 20] instead
  // of rendering every page number when there are many pages.
  function getPageNumbers() {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let last;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (last) {
        if (i - last === 2) rangeWithDots.push(last + 1);
        else if (i - last > 2) rangeWithDots.push("…");
      }
      rangeWithDots.push(i);
      last = i;
    });

    return rangeWithDots;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row">
      {totalItems != null && (
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-navy-900">{start}</span>–
          <span className="font-medium text-navy-900">{end}</span> of{" "}
          <span className="font-medium text-navy-900">{totalItems}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                p === page
                  ? "bg-electric-500 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}>
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
