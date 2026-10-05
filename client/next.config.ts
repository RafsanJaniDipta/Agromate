import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Picks up i18n/request.ts for translations
const withNextIntl = createNextIntlPlugin();

// Sent with every page. Mainly stops other sites from loading the dashboards
// in a hidden frame and tricking a logged-in user into clicking (clickjacking).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The disease check takes photos; nothing here needs the mic or location
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
