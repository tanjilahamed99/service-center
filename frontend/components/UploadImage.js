"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const IMGBB_API_KEY = "f6f078838eb85ba39146571c65470cb2"; // https://api.imgbb.com/

async function uploadFileToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData }
  );
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.data.url; // direct image link
}

/**
 * Reusable ImgBB uploader.
 *
 * Single mode:   <UploadImage value={url} onChange={(url) => ...} />
 * Multiple mode: <UploadImage multiple min={2} max={5} value={urls} onChange={(urls) => ...} />
 *
 * `value` / `onChange` always deal in URL strings (or arrays of them),
 * never raw File objects — so parent state is ready to submit as-is.
 */
export default function UploadImage({
  multiple = false,
  min = 0,
  max = multiple ? 10 : 1,
  value,
  onChange,
  label,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const urls = multiple ? value ?? [] : value ? [value] : [];

  // Mirrors `urls` but updates synchronously the instant an upload finishes,
  // instead of waiting for the value prop to round-trip back from the parent
  // on the next render. Without this, firing off two uploads back-to-back
  // (e.g. picking files twice quickly) would let the second one read a
  // stale `urls` array and overwrite the first result instead of merging.
  const latestUrlsRef = useRef(urls);
  useEffect(() => {
    latestUrlsRef.current = urls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!files.length) return;

      const currentCount = multiple ? latestUrlsRef.current.length : 0;
      if (multiple && currentCount + files.length > max) {
        setError(`You can attach at most ${max} photos.`);
        return;
      }

      setError("");
      setUploading(true);
      try {
        const uploaded = await Promise.all(files.map(uploadFileToImgBB));

        if (multiple) {
          const next = [...latestUrlsRef.current, ...uploaded];
          latestUrlsRef.current = next; // update before onChange, synchronously
          onChange?.(next);
        } else {
          latestUrlsRef.current = uploaded.slice(0, 1);
          onChange?.(uploaded[0]);
        }
      } catch (err) {
        setError(err.message || "Something went wrong while uploading");
      } finally {
        setUploading(false);
      }
    },
    [multiple, max, onChange]
  );

  function removeAt(idx) {
    if (multiple) {
      const next = urls.filter((_, i) => i !== idx);
      latestUrlsRef.current = next;
      onChange?.(next);
    } else {
      latestUrlsRef.current = [];
      onChange?.("");
    }
  }

  const inputId = `imgbb-upload-${label?.replace(/\s+/g, "-") || "field"}`;
  const belowMin = multiple && min > 0 && urls.length < min;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-navy-900">
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {urls.map((url, idx) => (
          <div
            key={url + idx}
            className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        {(multiple ? urls.length < max : urls.length === 0) && (
          <label
            htmlFor={inputId}
            className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-electric-400 hover:bg-slate-100"
          >
            <span className="text-xs text-slate-400">
              {uploading ? "Uploading…" : "+ Add"}
            </span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple={multiple}
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = ""; // allow re-selecting the same file
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      {multiple && (min > 0 || max) && (
        <p className="text-xs text-slate-400">
          {urls.length} / {max} photos{min > 0 ? ` (min ${min})` : ""}
        </p>
      )}

      {belowMin && !uploading && (
        <p className="text-xs text-amber-600">
          At least {min} photo(s) required.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}