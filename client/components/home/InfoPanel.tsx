import GlassCard from "@/components/home/GlassCard";

const forecast = [
  { day: "Today", icon: "☀", temp: "20°C", active: true },
  { day: "Tomorrow", icon: "●", temp: "24°C" },
  { day: "May 11", icon: "☁", temp: "24°C" },
  { day: "May 12", icon: "☂", temp: "23°C" },
];

const schedule = [
  { time: "08:00", label: "Field Check" },
  { time: "10:00", label: "Irrigation" },
  { time: "17:00", label: "Fertilizer" },
  { time: "18:00", label: "Harvest Plan" },
];

function PanelTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm">
        {icon}
      </span>
      <h3 className="text-[11px] uppercase tracking-wider text-white/70">{children}</h3>
    </div>
  );
}

// Right side widgets: market price, weather forecast and daily schedule.
export default function InfoPanel() {
  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="p-5">
        <PanelTitle icon="↗">Daily market prices</PanelTitle>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-white/70">Urea (46% N)</p>
            <p className="text-2xl font-semibold">₹318/kg</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Trend</p>
            <p className="text-sm font-medium text-lime-400">▲ +2.2%</p>
          </div>
        </div>
        <p className="mt-3 border-b border-white/10 pb-4 text-[11px] text-white/50">
          Note: This price is not fixed. It will fluctuate.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <PanelTitle icon="☁">Weather forecast</PanelTitle>
          <span className="text-[11px] text-white/50">May 9</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
          {forecast.map(({ day, icon, temp, active }) => (
            <div key={day} className={`rounded-xl px-1 py-2 ${active ? "bg-white/15" : ""}`}>
              <p className="text-white/60">{day}</p>
              <p className="my-1 text-base">{icon}</p>
              <p>{temp}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <PanelTitle icon="▦">Daily schedule</PanelTitle>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]">
          {schedule.map(({ time, label }) => (
            <div key={time} className="rounded-lg bg-white/10 px-1 py-2">
              <p className="text-white/60">{time}</p>
              <p className="mt-1">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
