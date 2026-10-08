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
  // Only this site may ask for the camera (disease check photos) and location (weather for where
  // the farmer is now); nothing here needs the mic
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's on-disk dev cache kept serving a deleted file (app/layout.tsx) after every
    // edit, because the project lives in a OneDrive folder whose syncing hides file deletions
    // from the watcher. Without the cache the dev server starts a few seconds slower but stays correct.
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    // Profile pictures are uploaded to Cloudinary by the API
    remotePatterns: [new URL("https://res.cloudinary.com/**")],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
