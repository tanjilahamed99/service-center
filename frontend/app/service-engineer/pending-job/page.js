import EngineerJobsListPage from "@/components/service-engineer/EngineerJobsListPage";

export default function PendingJobsPage() {
  return (
    <EngineerJobsListPage
      statusMode="pending"
      title="Pending Jobs"
      subtitle="Jobs assigned to you that aren't finished yet."
    />
  );
}