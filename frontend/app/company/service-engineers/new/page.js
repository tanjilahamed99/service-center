// app/company/service-engineers/new/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ServiceEngineerForm from "@/components/service-engineer/ServiceEngineerForm";
import { createServiceEngineer } from "@/actions/company";

export default function NewServiceEngineerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await createServiceEngineer(payload);
      router.push("/company/service-engineers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create service engineer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Add Service Engineer</h2>
        <p className="mt-1 text-sm text-slate-500">Assign a new engineer to one of your service centers.</p>
      </div>
      <ServiceEngineerForm mode="create" submitting={submitting} error={error} onSubmit={handleSubmit} />
    </div>
  );
}