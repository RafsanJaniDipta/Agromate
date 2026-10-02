import { useFormatter, useTranslations } from "next-intl";
import CardTitle from "@/components/home/CardTitle";
import GlassCard from "@/components/home/GlassCard";

// Sample forecast (°C) starting today, until a weather API is connected
const forecast = [
  { icon: "☀", temp: 20 },
  { icon: "●", temp: 24 },
  { icon: "☁", temp: 24 },
  { icon: "☂", temp: 23 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Four-day weather forecast shown in the hero.
export default function WeatherCard() {
  const t = useTranslations("weather");
  const format = useFormatter();
  const today = new Date();
  const shortDate = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });

  // Today and tomorrow read better as words; later days show their date
  function dayLabel(offset: number) {
    if (offset === 0) return t("today");
    if (offset === 1) return t("tomorrow");
    return shortDate(new Date(today.getTime() + offset * DAY_MS));
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <CardTitle icon="☁">{t("title")}</CardTitle>
        <span className="text-[11px] text-white/50">{shortDate(today)}</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
        {forecast.map(({ icon, temp }, offset) => (
          <div key={offset} className={`rounded-xl px-1 py-2 ${offset === 0 ? "bg-white/15" : ""}`}>
            <p className="text-white/60">{dayLabel(offset)}</p>
            <p className="my-1 text-base">{icon}</p>
            <p>{t("temperature", { value: temp })}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
