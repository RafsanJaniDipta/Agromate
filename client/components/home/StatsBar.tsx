import GlassCard from "@/components/home/GlassCard";

const stats = [
  { icon: "☺", value: "35K+", label: "Happy Farmers" },
  { icon: "❦", value: "20+", label: "Years Experience" },
  { icon: "★", value: "100+", label: "Expert Advisors" },
  { icon: "✔", value: "98%", label: "Farmer Satisfaction" },
];

// Bottom strip with key numbers.
export default function StatsBar() {
  return (
    <GlassCard className="grid grid-cols-2 gap-6 px-8 py-5 lg:grid-cols-4">
      {stats.map(({ icon, value, label }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand">
            {icon}
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight">{value}</p>
            <p className="text-[11px] text-white/60">{label}</p>
          </div>
        </div>
      ))}
    </GlassCard>
  );
}
