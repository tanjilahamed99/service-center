// app/company/service-centers/new/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ServiceCenterForm from "@/components/service-center/ServiceCenterForm";
import { createServiceCenter } from "@/actions/company";

export default function NewServiceCenterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await createServiceCenter(payload);
      router.push("/company/service-centers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create service center.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">Add Service Center</h2>
        <p className="mt-1 text-sm text-slate-500">Register a new center and its login.</p>
      </div>
      <ServiceCenterForm mode="create" submitting={submitting} error={error} onSubmit={handleSubmit} />
    </div>
  );
}