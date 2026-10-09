import { prisma } from "../../config/database.js";
import { getWeatherReport, resolvePlace, type WeatherReport } from "../../services/weather.service.js";
import { districtIn } from "../../utils/bdDistricts.js";

// Everything the assistant should know about one farmer, as short plain-text lines:
// their fields, the crops growing now, the local weather and the prices that matter to them.

const DAY_MS = 24 * 60 * 60 * 1000;
const FORECAST_DAYS = 4;

const dayText = (date: Date) => date.toISOString().slice(0, 10);

// The farmer's own location, or their first farm's
export async function farmerLocation(userId: string) {
  const [user, farm] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { location: true } }),
    prisma.farm.findFirst({ where: { userId }, orderBy: { createdAt: "asc" }, select: { location: true } }),
  ]);
  return user?.location || farm?.location || null;
}

// The weather where the farmer is; null if the weather service is down
export async function farmerWeather(userId: string): Promise<WeatherReport | null> {
  try {
    return await getWeatherReport(await resolvePlace(await farmerLocation(userId)));
  } catch {
    return null;
  }
}

export async function buildFarmerContext(userId: string): Promise<string> {
  const [user, farms, weather] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, location: true } }),
    prisma.farm.findMany({
      where: { userId },
      select: {
        name: true,
        location: true,
        areaInAcres: true,
        soilType: true,
        fields: {
          select: {
            name: true,
            areaInAcres: true,
            soilType: true,
            cropCycles: {
              where: { status: { in: ["PLANNED", "PLANTED", "GROWING"] } },
              select: {
                plantingDate: true,
                expectedHarvestDate: true,
                status: true,
                crop: { select: { id: true, name: true, nameBn: true } },
              },
            },
          },
        },
      },
    }),
    farmerWeather(userId),
  ]);

  const lines: string[] = [];
  const location = user?.location || farms[0]?.location || null;
  lines.push(`Farmer: ${user?.name ?? "unknown"}; location: ${location ?? "not given"}; district: ${(location && districtIn(location)) ?? "unknown"}`);

  // Fields and what grows on them
  const cropIds = new Set<string>();
  if (farms.length === 0) lines.push("No farms or fields added yet.");
  for (const farm of farms) {
    lines.push(`Farm "${farm.name}" (${farm.location}, ${farm.areaInAcres ?? "?"} acres, soil ${farm.soilType ?? "unknown"})`);
    for (const field of farm.fields) {
      const crops = field.cropCycles.map((cycle) => {
        cropIds.add(cycle.crop.id);
        const days = Math.floor((Date.now() - cycle.plantingDate.getTime()) / DAY_MS);
        const harvest = cycle.expectedHarvestDate ? `, harvest expected ${dayText(cycle.expectedHarvestDate)}` : "";
        return `${cycle.crop.name}${cycle.crop.nameBn ? ` (${cycle.crop.nameBn})` : ""}: ${cycle.status.toLowerCase()}, planted ${dayText(cycle.plantingDate)} (day ${days})${harvest}`;
      });
      lines.push(
        `  Field "${field.name}" (${field.areaInAcres ?? "?"} acres, soil ${field.soilType ?? "unknown"}): ${crops.length ? crops.join("; ") : "nothing growing"}`,
      );
    }
  }

  // Weather where the farmer is
  if (weather) {
    const { current, days } = weather;
    lines.push(
      `Weather now: ${current.temperatureC}°C, ${current.condition}, humidity ${current.humidityPercent}%, wind ${current.windKmh} km/h, rain chance ${current.rainChancePercent}%`,
    );
    for (const day of days.slice(0, FORECAST_DAYS)) {
      lines.push(
        `  ${day.date}: ${day.condition}, ${day.minTempC}-${day.maxTempC}°C, rain chance ${day.rainChancePercent}%, rain ${day.rainfallMm} mm`,
      );
    }
  } else {
    lines.push("Weather: not available right now.");
  }

  // Latest prices of the farmer's crops and of fertilizer
  const items = await prisma.priceItem.findMany({
    where: { isActive: true, OR: [{ cropId: { in: [...cropIds] } }, { category: "FERTILIZER" }] },
    select: {
      nameEn: true,
      unitEn: true,
      category: true,
      records: { orderBy: { date: "desc" }, take: 1, select: { minPrice: true, maxPrice: true, date: true, source: true } },
    },
  });
  for (const item of items) {
    const record = item.records[0];
    if (!record) continue;
    const price = record.minPrice === record.maxPrice ? `${record.minPrice}` : `${record.minPrice}-${record.maxPrice}`;
    const source = record.source === "TCB" ? "Dhaka retail (TCB)" : record.source === "GOVERNMENT" ? "government rate" : "admin price";
    lines.push(`Price of ${item.nameEn}: Tk ${price} per ${item.unitEn} (${source}, ${dayText(record.date)})`);
  }

  return lines.join("\n");
}
