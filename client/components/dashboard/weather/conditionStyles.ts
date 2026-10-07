import { CloudIcon, CloudSunIcon, MoonIcon, RainIcon, StormIcon, SunIcon } from "@/components/icons";
import type { WeatherCondition } from "@/lib/weather";

// Icon and sky colour for each weather condition, shared by the weather card and the forecast page
export const conditionStyles: Record<WeatherCondition, { Icon: typeof SunIcon; sky: string }> = {
  sunny: { Icon: SunIcon, sky: "from-sky-600 via-sky-700 to-blue-950" },
  clearNight: { Icon: MoonIcon, sky: "from-indigo-900 via-slate-900 to-zinc-950" },
  partlyCloudy: { Icon: CloudSunIcon, sky: "from-sky-600 via-slate-600 to-slate-900" },
  cloudy: { Icon: CloudIcon, sky: "from-slate-500 via-slate-600 to-blue-950" },
  rainy: { Icon: RainIcon, sky: "from-slate-600 via-slate-700 to-slate-950" },
  stormy: { Icon: StormIcon, sky: "from-slate-700 via-zinc-800 to-zinc-950" },
};
