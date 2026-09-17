"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Modal from "../job/Modal";

/**
 * Captures a digital signature on a canvas and hands back an uploaded URL,
 * using the same upload function your UploadImage component uses — pass it
 * in as `uploadFn` so there's one upload pathway, not two.
 */
export default function SignatureModal({ open, onClose, onSave, uploadFn }) {
  const sigRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleClear() {
    sigRef.current?.clear();
    setIsEmpty(true);
    setError("");
  }

  function handleClose() {
    handleClear();
    onClose?.();
  }

  async function handleSave() {
    if (sigRef.current?.isEmpty()) {
      setError("Please draw a signature first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // getTrimmedCanvas() crops to just the drawn strokes, not the whole blank pad
      const canvas = sigRef.current.getTrimmedCanvas();
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      const file = new File([blob], `signature-${Date.now()}.png`, {
        type: "image/png",
      });

      const url = await uploadFn(file);
      onSave?.(url);
      handleClose();
    } catch (err) {
      console.error("Failed to save signature", err);
      setError("Failed to save signature. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Customer Signature">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Please have the customer sign in the box below using a mouse, finger,
          or stylus.
        </p>

        <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            onBegin={() => setIsEmpty(false)}
            canvasProps={{
              className: "w-full h-56 touch-none",
            }}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="flex justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={uploading || isEmpty}
              className="rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
              {uploading ? "Saving…" : "Save Signature"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
