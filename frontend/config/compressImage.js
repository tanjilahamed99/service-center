// utils/compressImage.js
import imageCompression from "browser-image-compression";

/**
 * Compresses an image file client-side before upload.
 * Defaults aim for ~1MB max, capped at 1920px on the longest side —
 * plenty for viewing on screen, a fraction of a raw camera capture.
 */
export async function compressImage(file, options = {}) {
  const defaults = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true, // keeps the compression off the main thread — no UI jank
    initialQuality: 0.8,
  };

  try {
    const compressed = await imageCompression(file, { ...defaults, ...options });
    // browser-image-compression returns a Blob without a filename — reattach one
    return new File([compressed], file.name, { type: compressed.type });
  } catch (err) {
    console.error("Image compression failed, using original file:", err);
    return file; // fail open — an uncompressed upload beats a broken one
  }
}