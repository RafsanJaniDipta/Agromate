"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { conditionStyles } from "@/components/dashboard/weather/conditionStyles";
import { DropIcon, SunIcon } from "@/components/icons";
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

// The next 7 days, one card each: sky, low / high, chance of rain, rainfall, UV and a farming tip.
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

  return (
    <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {days.map((day, index) => {
        const { Icon } = conditionStyles[day.condition];
        const tip = farmingTip(day);

        return (
          <li key={day.date}>
            <DashCard className="flex h-full flex-col gap-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{dayName(day.date, index)}</h2>
                  <p className="text-xs text-white/60">
                    {format.dateTime(new Date(day.date), { day: "numeric", month: "long" })}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <Icon className="size-6" />
                </span>
              </header>

              <div className="flex items-end justify-between gap-3">
                {/* The day's range, labelled so the high isn't read as the temperature right now */}
                <dl className="flex items-end gap-4">
                  <div>
                    <dt className="text-xs text-white/50">{t("high")}</dt>
                    <dd className="text-3xl font-light tracking-tight">
                      {tWeather("temperature", { value: day.maxTempC })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/50">{t("low")}</dt>
                    <dd className="text-lg text-white/60">{tWeather("temperature", { value: day.minTempC })}</dd>
                  </div>
                </dl>
                <p className="text-sm text-white/80">{tWeather(`conditions.${day.condition}`)}</p>
              </div>

              {/* Chance of rain as a bar, since it's what decides most farm work */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <DropIcon className="size-3.5" />
                    {tWeather("rainChance")}
                  </span>
                  <span>{tWeather("rainChanceValue", { value: day.rainChancePercent })}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={tWeather("rainChance")}
                  aria-valuenow={day.rainChancePercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-white/10"
                >
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${day.rainChancePercent}%` }} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/5 px-3 py-2">
                  <dt className="text-xs text-white/50">{t("rainfall")}</dt>
                  <dd>{t("rainfallValue", { value: day.rainfallMm })}</dd>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-2">
                  <dt className="flex items-center gap-1 text-xs text-white/50">
                    <SunIcon className="size-3" />
                    {t("maxUv")}
                  </dt>
                  <dd>{tWeather("uvValue", { value: day.uvIndex })}</dd>
                </div>
              </dl>

              {tip && (
                <p
                  className={`mt-auto rounded-2xl border px-3 py-2 text-xs ${
                    tip === "rain"
                      ? "border-sky-300/30 bg-sky-300/10 text-sky-100"
                      : "border-amber-300/30 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {t(`tips.${tip}`)}
                </p>
              )}
            </DashCard>
          </li>
        );
      })}
    </ul>
  );
}
