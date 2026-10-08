import DashCard from "@/components/dashboard/DashCard";

type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

// Small KPI card: icon + title on top, the card's own figures below.
export default function StatCard({ icon, title, children }: StatCardProps) {
  return (
    <DashCard className="flex flex-col">
      <h2 className="flex items-center gap-2.5 font-medium">
        <span className="size-5 shrink-0 [&>svg]:size-full">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </DashCard>
  );
}
