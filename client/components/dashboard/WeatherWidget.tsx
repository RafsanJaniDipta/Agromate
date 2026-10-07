"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import { conditionStyles } from "@/components/dashboard/weather/conditionStyles";
import { CloudSunIcon, DropIcon, MapPinIcon, SunIcon, WindIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getCurrentWeather, type CurrentWeather, type WeatherQuery } from "@/lib/weather";

type WeatherWidgetProps = {
  // Whose weather; the farmer's own place when left out
  query?: WeatherQuery;
  // Page with the full forecast; adds a link to it
  detailsHref?: string;
};

// Today's weather where the farmer farms: big temperature plus rain chance, wind and UV tiles.
export default function WeatherWidget({ query, detailsHref }: WeatherWidgetProps) {
  const t = useTranslations("dashboard.weather");
  const format = useFormatter();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Ignores an older answer that arrives after another place was picked
    let isCurrent = true;
    getCurrentWeather(query)
      .then((loaded) => isCurrent && setWeather(loaded))
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [query]);

  // Coordinates have no name; an unfound place shows Dhaka's weather, so say so
  const placeLabel = (loaded: CurrentWeather) =>
    query?.kind === "coords" ? t("currentLocation") : (loaded.location ?? t("defaultLocation"));

  // Plain sky while loading or when the weather service is down
  const { Icon, sky } = conditionStyles[weather?.condition ?? "partlyCloudy"];

  const details = weather
    ? ([
        { key: "rainChance", Icon: DropIcon, value: t("rainChanceValue", { value: weather.rainChancePercent }) },
        { key: "wind", Icon: WindIcon, value: t("windValue", { value: weather.windKmh }) },
        { key: "uv", Icon: SunIcon, value: t("uvValue", { value: weather.uvIndex }) },
      ] as const)
    : [];

  return (
    <section
      className={`relative isolate overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b p-5 ${sky}`}
    >
      {/* Soft cloud shapes give the plain gradient some depth */}
      <div aria-hidden className="absolute -left-10 top-1/3 -z-10 size-48 rounded-full bg-white/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-10 -right-6 -z-10 size-40 rounded-full bg-white/20 blur-3xl" />

      <CardHeader icon={<CloudSunIcon />} title={t("title")} href={detailsHref} />

      {!weather ? (
        <p className="py-16 text-center text-sm text-white/80">{loadFailed ? t("loadError") : t("loading")}</p>
      ) : (
        <>
          <div className="mt-5 text-center">
            <p className="inline-flex items-center gap-1 text-sm text-white/85">
              <MapPinIcon className="size-3.5" />
              {placeLabel(weather)}
              {" · "}
              {format.dateTime(new Date(weather.date), { day: "numeric", month: "long" })}
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-white/70">{t("now")}</p>
            <p className="text-5xl font-light tracking-tight">
              {t("temperature", { value: weather.temperatureC })}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
              <Icon className="size-4" />
              {t(`conditions.${weather.condition}`)}
            </p>
            <p className="mt-1 text-xs text-white/75">
              {t("highLow", {
                high: t("temperature", { value: weather.todayMaxC }),
                low: t("temperature", { value: weather.todayMinC }),
              })}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-2">
            {details.map(({ key, Icon: DetailIcon, value }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-md"
              >
                <dt>
                  <DetailIcon className="size-4" />
                  <span className="sr-only">{t(key)}</span>
                </dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {detailsHref && (
        <Link
          href={detailsHref}
          className="mt-4 block rounded-2xl border border-white/20 bg-white/10 py-2.5 text-center text-sm backdrop-blur-md transition hover:bg-white/20"
        >
          {t("seeWeek")}
        </Link>
      )}
    </section>
  );
}
