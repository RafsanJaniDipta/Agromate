"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { conditionStyles } from "@/components/dashboard/weather/conditionStyles";
import { getWeatherForecast, type DayForecast, type WeatherQuery } from "@/lib/weather";

// From this chance of rain, spraying or fertilising that day is likely wasted
const RAIN_WARNING_PERCENT = 60;
// From this temperature (°C), crops need water and people need shade
const HEAT_WARNING_C = 35;

// One short tip for the day, the most important first
function farmingTip(day: DayForecast): "rain" | "heat" | null {
  if (day.rainChancePercent >= RAIN_WARNING_PERCENT) return "rain";
  if (day.maxTempC >= HEAT_WARNING_C) return "heat";
  return null;
}

// The next 7 days as a table, one row per day: sky, high / low, chance of rain, rainfall,
// UV and a farming tip. Scrolls sideways on phones, like the market price table.
export default function WeekForecast({ query }: { query: WeatherQuery }) {
  const t = useTranslations("dashboard.weatherPage");
  const tWeather = useTranslations("dashboard.weather");
  const format = useFormatter();
  const [days, setDays] = useState<DayForecast[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Ignores an older answer that arrives after another place was picked
    let isCurrent = true;
    getWeatherForecast(query)
      .then((loaded) => isCurrent && setDays(loaded))
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [query]);

  if (!days) {
    return (
      <DashCard>
        <p className="text-sm text-white/70">{loadFailed ? t("loadError") : t("loading")}</p>
      </DashCard>
    );
  }

  // "Today", "Tomorrow", then the weekday
  const dayName = (date: string, index: number) =>
    index === 0
      ? tWeather("today")
      : index === 1
        ? tWeather("tomorrow")
        : format.dateTime(new Date(date), { weekday: "long" });

  const headCell = "px-4 py-3 text-left text-xs font-medium text-white/55";
  const cell = "px-4 py-3 align-middle";

  return (
    <DashCard className="overflow-hidden p-0">
      <div data-lenis-prevent className="overflow-x-auto">
        <table className="w-full min-w-4xl border-collapse text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th scope="col" className={headCell}>{t("table.day")}</th>
              <th scope="col" className={headCell}>{t("table.sky")}</th>
              <th scope="col" className={headCell}>
                {t("high")} / {t("low")}
              </th>
              <th scope="col" className={headCell}>{tWeather("rainChance")}</th>
              <th scope="col" className={headCell}>{t("rainfall")}</th>
              <th scope="col" className={headCell}>{t("maxUv")}</th>
              <th scope="col" className={headCell}>{t("table.tip")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {days.map((day, index) => {
              const { Icon } = conditionStyles[day.condition];
              const tip = farmingTip(day);

              return (
                <tr key={day.date} className="transition hover:bg-white/5">
                  <th scope="row" className={`${cell} whitespace-nowrap text-left font-normal`}>
                    <span className="block font-medium">{dayName(day.date, index)}</span>
                    <span className="block text-xs text-white/50">
                      {format.dateTime(new Date(day.date), { day: "numeric", month: "long" })}
                    </span>
                  </th>

                  <td className={cell}>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
                        <Icon className="size-5" />
                      </span>
                      {tWeather(`conditions.${day.condition}`)}
                    </span>
                  </td>

                  {/* The day's range, so the high isn't read as the temperature right now */}
                  <td className={`${cell} whitespace-nowrap`}>
                    <span className="text-lg font-medium">{tWeather("temperature", { value: day.maxTempC })}</span>
                    <span className="text-white/50"> / {tWeather("temperature", { value: day.minTempC })}</span>
                  </td>

                  {/* As a bar too, since it's what decides most farm work */}
                  <td className={cell}>
                    <span className="flex items-center gap-2">
                      <span
                        role="progressbar"
                        aria-label={tWeather("rainChance")}
                        aria-valuenow={day.rainChancePercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 w-20 overflow-hidden rounded-full bg-white/10"
                      >
                        <span className="block h-full rounded-full bg-sky-400" style={{ width: `${day.rainChancePercent}%` }} />
                      </span>
                      <span className="whitespace-nowrap text-xs text-white/80">
                        {tWeather("rainChanceValue", { value: day.rainChancePercent })}
                      </span>
                    </span>
                  </td>

                  <td className={`${cell} whitespace-nowrap`}>{t("rainfallValue", { value: day.rainfallMm })}</td>
                  <td className={`${cell} whitespace-nowrap`}>{tWeather("uvValue", { value: day.uvIndex })}</td>

                  <td className={`${cell} text-xs`}>
                    {tip ? (
                      <span
                        className={`block rounded-xl border px-3 py-1.5 ${
                          tip === "rain"
                            ? "border-sky-300/30 bg-sky-300/10 text-sky-100"
                            : "border-amber-300/30 bg-amber-300/10 text-amber-100"
                        }`}
                      >
                        {t(`tips.${tip}`)}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}
