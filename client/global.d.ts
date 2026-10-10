import type { routing } from "@/i18n/routing";
import type messages from "./messages/en.json";

// Type-checks translation keys and locales against en.json
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

// Stagger index for [data-reveal] elements, read by globals.css
declare module "react" {
  interface CSSProperties {
    "--i"?: number;
  }
}
