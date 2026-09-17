"use client";

import { useState } from "react";
import Modal from "./Modal";

function ImageGrid({ title, urls }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-navy-900">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, i) => (
          <ImageThumb key={url + i} url={url} />
        ))}
      </div>
    </div>
  );
}

function ImageThumb({ url }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 aspect-square">
      {broken ? (
        <div className="flex h-full items-center justify-center text-xs text-slate-400">
          Image unavailable
        </div>
      ) : (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover transition hover:scale-105"
          onError={() => setBroken(true)}
        />
      )}
    </a>
  );
}

export default function ViewImagesModal({ open, job, onClose }) {
  if (!job) return null;

  const hasClosurePhotos = job.closurePhotos?.length > 0;
  const hasHoldPhotos = job.holdPhotos?.length > 0;
  const hasSignature = !!job.customerSignature;
  const hasNothing = !hasClosurePhotos && !hasHoldPhotos && !hasSignature;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Images — ${job.complaintNumber ?? job._id}`}>
      <div className="space-y-5">
        {hasNothing && (
          <p className="text-sm text-slate-400">
            No images were submitted for this job.
          </p>
        )}

        <ImageGrid title="Closure Photos" urls={job.closurePhotos} />
        <ImageGrid title="Hold Photos" urls={job.holdPhotos} />

        {hasSignature && (
          <div>
            <p className="mb-2 text-sm font-medium text-navy-900">
              Customer Signature
            </p>
            <ImageThumb url={job.customerSignature} />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
