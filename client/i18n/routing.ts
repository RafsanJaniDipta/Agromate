import { defineRouting } from "next-intl/routing";

// Supported languages; every URL starts with one of these (/en/..., /bn/...)
export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
});
