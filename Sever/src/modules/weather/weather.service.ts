export class WeatherService {
  static async getCurrentWeather(location?: string, lat?: string, lon?: string) {
    const loc = location || (lat && lon ? `${lat},${lon}` : "Dhaka");
    return {
      location: loc,
      temp: 28.5,
      condition: "Partly Cloudy",
      humidity: 72,
      windSpeed: 12.4,
    };
  }

  static async getWeatherForecast(location?: string, days: number = 7) {
    const loc = location || "Dhaka";
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      forecast.push({
        date: d.toISOString().split("T")[0],
        maxTemp: 30 + (i % 3),
        minTemp: 22 + (i % 2),
        condition: i % 2 === 0 ? "Sunny" : "Rain Showers",
        rainChance: i % 2 === 0 ? 10 : 60,
      });
    }

    return {
      location: loc,
      forecast,
    };
  }
}
