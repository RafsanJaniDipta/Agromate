import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends visitors without a language in the URL to /en or /bn, based on their cookie or browser language
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and files with an extension (images, videos, favicon)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
