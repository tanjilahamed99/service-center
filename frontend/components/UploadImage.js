"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/config/compressImage";

const IMGBB_API_KEY = "cf3e237cff891fb67b34bc023a1a5413"; // https://api.imgbb.com/

export async function uploadFileToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData },
  );
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.data.url;
}

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

  const urls = multiple ? (value ?? []) : value ? [value] : [];

  const latestUrlsRef = useRef(urls);
  useEffect(() => {
    latestUrlsRef.current = urls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []).filter((f) =>
        f.type.startsWith("image/"),
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
        // Compress each file before it ever hits ImgBB — a raw camera
        // capture can be 5–12MB; this brings it down to ~1MB without a
        // visible quality loss on screen.
        const compressedFiles = await Promise.all(files.map(compressImage));
        const uploaded = await Promise.all(
          compressedFiles.map(uploadFileToImgBB),
        );

        if (multiple) {
          const next = [...latestUrlsRef.current, ...uploaded];
          latestUrlsRef.current = next;
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
    [multiple, max, onChange],
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
            className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100">
              ×
            </button>
          </div>
        ))}

        {(multiple ? urls.length < max : urls.length === 0) && (
          <label
            htmlFor={inputId}
            className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-electric-400 hover:bg-slate-100">
            <span className="text-xs text-slate-400">
              {uploading ? "Compressing…" : "+ Add"}
            </span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple={multiple}
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
              capture="environment"
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
