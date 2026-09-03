import ServiceEngineerJobsListPage from "@/components/service-engineer/ServiceCenterJobsListPage";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
          Jobs
        </p>
        <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
          All Jobs
        </h2>
      </div>

      <ServiceEngineerJobsListPage />
    </div>
  );
}
