"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CompanyForm from "@/components/company/CompanyForm";
import { useEffect, useState } from "react";
import { getCompanyById, updateCompanyData } from "@/actions/admin";
import { toast } from "sonner";

export default function EditCompanyPage() {
  const router = useRouter();
  const { id } = useParams();
  const [company, setCompany] = useState(null);

  async function handleUpdate(values) {
    try {
      const { data } = await updateCompanyData({ data: values, id });
      if (data.success) {
        toast.success("Update Successful");
        router.push("/admin/companies");
      }
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message || "Something went wrong";

      toast.error(message);
    }
  }

  useEffect(() => {
    const fetch = async () => {
      const { data } = await getCompanyById(id);
      if (data.success) {
        setCompany(data.company);
      }
    };
    fetch();
  }, [id]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">Company not found.</p>
        <Link
          href="/admin/companies"
          className="mt-3 inline-block text-sm font-medium text-electric-500 hover:text-electric-400">
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/companies"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 12H5M11 18l-6-6 6-6"
            />
          </svg>
          Back to Companies
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
          Companies
        </p>
        <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
          Edit {company.companyName}
        </h2>
      </div>

      <CompanyForm initialData={company} isEditMode onSubmit={handleUpdate} />
    </div>
  );
}
