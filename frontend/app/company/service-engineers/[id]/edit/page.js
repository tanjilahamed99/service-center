// app/company/service-engineers/[id]/edit/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ServiceEngineerForm from "@/components/service-engineer/ServiceEngineerForm";
import { getServiceEngineerById, updateServiceEngineer } from "@/actions/company";

export default function EditServiceEngineerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getServiceEngineerById(id)
      .then((res) => setInitialValues(res.data?.data))
      .catch((err) => {
        console.error("Failed to load service engineer", err);
        setError("Failed to load this service engineer.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await updateServiceEngineer(id, payload);
      router.push("/company/service-engineers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update service engineer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!initialValues) return <p className="text-sm text-red-500">{error || "Not found."}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Edit Service Engineer</h2>
      </div>
      <ServiceEngineerForm mode="edit" initialValues={{ ...initialValues, password: "" }} submitting={submitting} error={error} onSubmit={handleSubmit} />
    </div>
  );
}