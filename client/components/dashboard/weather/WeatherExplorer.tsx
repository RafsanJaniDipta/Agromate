"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import WeekForecast from "@/components/dashboard/weather/WeekForecast";
import { darkInput, darkLabel, secondaryButton } from "@/components/dashboard/formStyles";
import { LocateIcon } from "@/components/icons";
import { getFarms, type Farm } from "@/lib/farms";
import { getDistricts, type District, type WeatherQuery } from "@/lib/weather";

// Picker values: "own", "farm:<id>", "district:<Bangla name>" or "coords"
type Choice = string;

// "denied": the farmer (or the browser) said no; "unavailable": allowed, but no position was found in time
type GpsStatus = "idle" | "locating" | "denied" | "unavailable";

type WeatherExplorerProps = {
  // The page's title card, shown beside the place picker
  header: React.ReactNode;
};

// Weather page body: pick whose weather to see (own place, one of the farmer's places,
// any district, or where the device is now), then today's weather and the next 7 days for it.
export default function WeatherExplorer({ header }: WeatherExplorerProps) {
  const t = useTranslations("dashboard.weatherPage");
  const locale = useLocale();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [choice, setChoice] = useState<Choice>("own");
  // Changes only when the farmer picks something, so the weather loads once per pick
  const [query, setQuery] = useState<WeatherQuery>({ kind: "own" });
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");

  // The picker still works with whatever loads; a failed list just leaves its group out
  useEffect(() => {
    getFarms().then(setFarms).catch(() => {});
    getDistricts().then(setDistricts).catch(() => {});
  }, []);

  const districtName = (district: District) => (locale === "bn" ? district.nameBn : district.nameEn);
  const sortedDistricts = [...districts].sort((a, b) => districtName(a).localeCompare(districtName(b), locale));

  function pick(value: Choice) {
    setChoice(value);
    setGpsStatus("idle");

    if (value.startsWith("farm:")) {
      const farm = farms.find(({ id }) => `farm:${id}` === value);
      if (farm) setQuery({ kind: "place", location: farm.location });
    } else if (value.startsWith("district:")) {
      setQuery({ kind: "place", location: value.slice("district:".length) });
    } else {
      setQuery({ kind: "own" });
    }
  }

  // Asks the browser where the device is; the browser shows its own "Allow location?" popup
  function locateDevice() {
    if (!navigator.geolocation) return setGpsStatus("unavailable");

    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setChoice("coords");
        setQuery({ kind: "coords", lat: coords.latitude, lon: coords.longitude });
        setGpsStatus("idle");
      },
      (error) => setGpsStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10_000 },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title and place picker side by side on wide screens, stacked on phones */}
      <div className="grid gap-5 lg:grid-cols-2">
        {header}

        <DashCard className="flex flex-col justify-center gap-2">
          <label htmlFor="weather-place" className={darkLabel}>
            {t("placeLabel")}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="weather-place"
              value={choice}
              onChange={(event) => pick(event.target.value)}
              className={`${darkInput} min-w-0 flex-1 py-2.5`}
            >
              <option value="own" className="bg-zinc-900">
                {t("ownPlace")}
              </option>
              {choice === "coords" && (
                <option value="coords" className="bg-zinc-900">
                  {t("currentLocation")}
                </option>
              )}
              {farms.length > 0 && (
                <optgroup label={t("myPlaces")} className="bg-zinc-900">
                  {farms.map((farm) => (
                    <option key={farm.id} value={`farm:${farm.id}`} className="bg-zinc-900">
                      {`${farm.name}, ${farm.location}`}
                    </option>
                  ))}
                </optgroup>
              )}
              {sortedDistricts.length > 0 && (
                <optgroup label={t("districts")} className="bg-zinc-900">
                  {sortedDistricts.map((district) => (
                    <option key={district.nameBn} value={`district:${district.nameBn}`} className="bg-zinc-900">
                      {districtName(district)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <button
              type="button"
              onClick={locateDevice}
              disabled={gpsStatus === "locating"}
              className={`${secondaryButton} inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap`}
            >
              <LocateIcon className="size-4" />
              {gpsStatus === "locating" ? t("locating") : t("useMyLocation")}
            </button>
          </div>
        </DashCard>
      </div>

      {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
        <p role="status" className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {gpsStatus === "denied" ? t("locationDenied") : t("locationUnavailable")}
        </p>
      )}

      {/* A new key per place remounts both cards, so they start from "loading" again */}
      <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
        <WeatherWidget key={`now-${JSON.stringify(query)}`} query={query} />
        <WeekForecast key={`week-${JSON.stringify(query)}`} query={query} />
      </div>
    </div>
  );
}
