// app/company/service-centers/[id]/edit/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ServiceCenterForm from "@/components/service-center/ServiceCenterForm";
import { getServiceCenterById, updateServiceCenter } from "@/actions/company";

export default function EditServiceCenterPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getServiceCenterById(id)
      .then((res) => setInitialValues(res.data?.data))
      .catch((err) => {
        console.error("Failed to load service center", err);
        setError("Failed to load this service center.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await updateServiceCenter(id, payload);
      router.push("/company/service-centers");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update service center.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!initialValues)
    return <p className="text-sm text-red-500">{error || "Not found."}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">
          Edit Service Center
        </h2>
      </div>
      <ServiceCenterForm
        mode="edit"
        initialValues={{ ...initialValues, password: "" }}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
