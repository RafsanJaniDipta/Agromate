// Message keys under "months", in calendar order: MONTH_KEYS[0] is January (month 1)
export const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

// Month number 1–12 → its message key
export const monthKey = (month: number): MonthKey => MONTH_KEYS[month - 1];

// Month numbers 1–12, for month pickers
export const MONTH_NUMBERS = MONTH_KEYS.map((_, index) => index + 1);

// True when `month` falls in start…end, including ranges that wrap past December (11 → 1)
export function isMonthInRange(month: number, start: number, end: number) {
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}
