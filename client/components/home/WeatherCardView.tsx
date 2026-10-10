"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { DropIcon, MapPinIcon, RainIcon, WindIcon } from "@/components/icons";
import CardTitle from "@/components/home/CardTitle";
import GlassCard from "@/components/home/GlassCard";
import { conditionStyles } from "@/components/dashboard/weather/conditionStyles";
import { getPlaceName, getWeatherAt, type HomeWeather } from "@/lib/weather";

// A rough position is enough for weather, and one from the last few minutes will do
const POSITION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 };

// The hero's weather card: what it's like right now, today's range, and the next days.
// It starts with Dhaka's weather from the server and switches to the visitor's own position,
// named by its area ("বগুড়া"), once the browser shares it. If they say no (or it can't be
// found), Dhaka's weather stays.
export default function WeatherCardView({ initialWeather }: { initialWeather: HomeWeather }) {
  const t = useTranslations("weather");
  const format = useFormatter();
  const locale = useLocale();
  const [weather, setWeather] = useState(initialWeather);
  // Set once the weather on screen is the visitor's own; `name` is null when their area has no known name
  const [ownPlace, setOwnPlace] = useState<{ name: string | null } | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    let isStale = false;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // The name is only a label: without it the card says "your area"
        Promise.all([
          getWeatherAt(coords.latitude, coords.longitude),
          getPlaceName(coords.latitude, coords.longitude, locale),
        ])
          .then(([localWeather, name]) => {
            if (isStale) return;
            setWeather(localWeather);
            setOwnPlace({ name });
          })
          .catch(() => {});
      },
      // Permission refused or no position: keep showing Dhaka
      () => {},
      POSITION_OPTIONS,
    );
    return () => {
      isStale = true;
    };
  }, [locale]);

  const { current, days } = weather;
  const today = days[0];
  const { Icon } = conditionStyles[current.condition];
  const degrees = (value: number) => t("temperature", { value });

  // Today and tomorrow read better as words; later days show their date.
  // Forecast dates are calendar days, so they're formatted without shifting time zones.
  function dayLabel(date: string, index: number) {
    if (index === 0) return t("today");
    if (index === 1) return t("tomorrow");
    return format.dateTime(new Date(`${date}T00:00:00Z`), { day: "numeric", month: "short", timeZone: "UTC" });
  }

  const details = [
    { Icon: DropIcon, label: t("humidity"), value: t("percent", { value: current.humidityPercent }) },
    { Icon: WindIcon, label: t("wind"), value: t("windValue", { value: current.windKmh }) },
    { Icon: RainIcon, label: t("rainChance"), value: t("percent", { value: current.rainChancePercent }) },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <CardTitle icon="☁">{t("title")}</CardTitle>
        <p aria-live="polite" className="flex min-w-0 items-center gap-1 text-[11px] text-white/70">
          <MapPinIcon className="size-3.5 shrink-0 text-lime-400" />
          <span className="truncate">{ownPlace ? (ownPlace.name ?? t("yourLocation")) : t("defaultLocation")}</span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Icon className="size-12 shrink-0 text-lime-300" />
        <div className="min-w-0">
          <p className="text-4xl font-semibold leading-none tracking-tight">{degrees(current.temperatureC)}</p>
          <p className="mt-1.5 text-sm text-white/75">{t(`conditions.${current.condition}`)}</p>
        </div>
        {today && (
          <p className="ml-auto text-right text-xs leading-relaxed text-white/60">
            {t("high", { value: today.maxTempC })}
            <br />
            {t("low", { value: today.minTempC })}
          </p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {details.map(({ Icon: DetailIcon, label, value }) => (
          <div key={label} className="rounded-xl bg-white/10 px-1 py-2">
            <DetailIcon className="mx-auto size-4 text-white/60" />
            <dt className="mt-1 text-[10px] text-white/55">{label}</dt>
            <dd className="text-xs font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
        {days.map((day, index) => {
          const { Icon: DayIcon } = conditionStyles[day.condition];
          return (
            <li key={day.date} className={`rounded-xl px-1 py-2 ${index === 0 ? "bg-white/15" : ""}`}>
              <p className="text-white/60">{dayLabel(day.date, index)}</p>
              <DayIcon className="mx-auto my-1.5 size-5" aria-label={t(`conditions.${day.condition}`)} />
              <p>
                {degrees(day.maxTempC)}
                <span className="text-white/45"> / {format.number(day.minTempC)}°</span>
              </p>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
