import { useFormatter } from "next-intl";

// Formats an amount in taka for the current language, e.g. "৳১২,৫০০" or "৳12,500".
// `compact` shortens big numbers for chart axes ("৳১২ হা", "৳12K").
export function useTaka() {
  const format = useFormatter();

  return (amount: number, { compact = false } = {}) =>
    format.number(amount, {
      style: "currency",
      currency: "BDT",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: compact ? 1 : 0,
      ...(compact ? { notation: "compact" } : {}),
    });
}
