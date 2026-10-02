import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Picks up i18n/request.ts for translations
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
