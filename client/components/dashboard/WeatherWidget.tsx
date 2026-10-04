import { useFormatter, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import {
  CloudIcon,
  CloudSunIcon,
  DropIcon,
  RainIcon,
  StormIcon,
  SunIcon,
  WindIcon,
} from "@/components/icons";
import type { WeatherCondition, WeatherSummary } from "@/types/dashboard";

// Icon and sky colour for each weather condition
const conditionStyles: Record<WeatherCondition, { Icon: typeof SunIcon; sky: string }> = {
  sunny: { Icon: SunIcon, sky: "from-sky-600 via-sky-700 to-blue-950" },
  partlyCloudy: { Icon: CloudSunIcon, sky: "from-sky-600 via-slate-600 to-slate-900" },
  cloudy: { Icon: CloudIcon, sky: "from-slate-500 via-slate-600 to-blue-950" },
  rainy: { Icon: RainIcon, sky: "from-slate-600 via-slate-700 to-slate-950" },
  stormy: { Icon: StormIcon, sky: "from-slate-700 via-zinc-800 to-zinc-950" },
};

type WeatherWidgetProps = {
  weather: WeatherSummary;
};

// Today's weather: big temperature plus rain, wind and UV tiles.
export default function WeatherWidget({ weather }: WeatherWidgetProps) {
  const t = useTranslations("dashboard.weather");
  const format = useFormatter();
  const { Icon, sky } = conditionStyles[weather.condition];

  const details = [
    { key: "rainfall", Icon: DropIcon, value: t("rainfallValue", { value: weather.rainfallMm }) },
    { key: "wind", Icon: WindIcon, value: t("windValue", { value: weather.windKmh }) },
    { key: "uv", Icon: SunIcon, value: t("uvValue", { value: weather.uvIndex }) },
  ] as const;

  return (
    <section
      className={`relative isolate overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b p-5 ${sky}`}
    >
      {/* Soft cloud shapes give the plain gradient some depth */}
      <div aria-hidden className="absolute -left-10 top-1/3 -z-10 size-48 rounded-full bg-white/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-10 -right-6 -z-10 size-40 rounded-full bg-white/20 blur-3xl" />

      <CardHeader icon={<CloudSunIcon />} title={t("title")} href="#" />

      <div className="mt-5 text-center">
        <p className="text-sm text-white/85">
          {format.dateTime(new Date(weather.date), { day: "numeric", month: "long" })}
        </p>
        <p className="text-5xl font-light tracking-tight">
          {t("temperature", { value: weather.temperatureC })}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
          <Icon className="size-4" />
          {t(`conditions.${weather.condition}`)}
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
    </section>
  );
}
