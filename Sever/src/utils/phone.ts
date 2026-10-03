/**
 * Utility to normalize phone numbers (converts Bengali digits to standard ASCII digits and formats phone numbers).
 */

const BENGALI_TO_ASCII_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Convert Bengali numerals to ASCII numerals
  let converted = phone
    .split("")
    .map((char) => BENGALI_TO_ASCII_DIGITS[char] || char)
    .join("");

  // Remove spaces, hyphens, and non-digit characters except leading plus
  converted = converted.trim().replace(/[\s\-()]/g, "");

  // Remove leading +88 or 88 if present for BD numbers
  if (converted.startsWith("+880")) {
    converted = "0" + converted.slice(4);
  } else if (converted.startsWith("880")) {
    converted = "0" + converted.slice(3);
  }

  // Ensure leading 0 if 10 digits starting with 1
  if (converted.length === 10 && converted.startsWith("1")) {
    converted = "0" + converted;
  }

  return converted;
}
