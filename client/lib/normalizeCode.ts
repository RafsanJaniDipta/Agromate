// Lowercase and drop spaces, "_" and "-", so "Partly Cloudy" and "partlyCloudy" compare equal
const simplify = (text: string) => text.toLowerCase().replace(/[\s_-]/g, "");

// Matches a code from the API to one of the allowed codes, forgiving case and separators:
// "Cloudy", "PARTLY_CLOUDY" and "partly cloudy" all find their match.
// An unknown code falls back to `fallback`, so a typo shows a default instead of crashing the page.
export function normalizeCode<T extends string>(
  value: string,
  allowedCodes: readonly T[],
  fallback: T,
): T {
  const match = allowedCodes.find((code) => simplify(code) === simplify(value));
  if (!match) console.warn(`Unknown code "${value}" from the API, showing "${fallback}" instead`);
  return match ?? fallback;
}
