"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CompanyForm from "@/components/company/CompanyForm";
import { createCompany } from "@/actions/admin";
import { toast } from "sonner";

export default function AddCompanyPage() {
  const router = useRouter();

  async function handleCreate(values) {
    try {
      const { data } = await createCompany(values);
      if (data.success) {
        toast.success("Company created successful");
        router.push("/admin/companies");
      }
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message || "Something went wrong";

      toast.error(message);
    }
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
          Add New Company
        </h2>
      </div>

      <CompanyForm onSubmit={handleCreate} />
    </div>
  );
}
