import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Next's navigation helpers; they keep the current language in URLs
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
