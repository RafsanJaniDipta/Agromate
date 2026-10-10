import { getTranslations } from "next-intl/server";
import CardTitle from "@/components/home/CardTitle";
import GlassCard from "@/components/home/GlassCard";
import WeatherCardView from "@/components/home/WeatherCardView";
import { getHomeWeather } from "@/lib/weather";

// Live weather in the hero. The page is rendered with Dhaka's weather (cached on the server,
// see getHomeWeather); the browser then swaps in the weather where the visitor is.
export default async function WeatherCard() {
  const [t, weather] = await Promise.all([getTranslations("weather"), getHomeWeather()]);

  if (!weather) {
    return (
      <GlassCard className="p-5">
        <CardTitle icon="☁">{t("title")}</CardTitle>
        <p className="mt-4 text-sm text-white/60">{t("unavailable")}</p>
      </GlassCard>
    );
  }

  return <WeatherCardView initialWeather={weather} />;
}
