import { useFormatter } from "next-intl";
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

// Signed percent change, e.g. "+12.4%" in green or "−3.1%" in red.
export function ChangeBadge({ percent }: { percent: number }) {
  const format = useFormatter();
  const color = percent >= 0 ? "text-green-400" : "text-red-400";

  return (
    <span className={`text-xs ${color}`}>
      {format.number(percent / 100, {
        style: "percent",
        maximumFractionDigits: 1,
        signDisplay: "exceptZero",
      })}
    </span>
  );
}
