import EngineerJobsListPage from "@/components/service-engineer/EngineerJobsListPage";

export default function CompletedJobsPage() {
  return (
    <EngineerJobsListPage
      statusMode="completed"
      title="Completed Jobs"
      subtitle="Jobs you've closed."
    />
  );
}