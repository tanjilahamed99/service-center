import EngineerJobsListPage from "@/components/service-engineer/EngineerJobsListPage";

export default function CompletedJobsPage() {
  return (
    <EngineerJobsListPage
      statusMode="hold"
      title="Completed Jobs"
      subtitle="Jobs you've closed."
    />
  );
}
