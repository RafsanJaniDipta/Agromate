import {
  BarnIcon,
  ChartIcon,
  ChatIcon,
  CoinsIcon,
  CowIcon,
  HelpIcon,
  HomeIcon,
  LeafIcon,
  MapIcon,
  ShieldIcon,
  TractorIcon,
  UserIcon,
  WheatIcon,
} from "@/components/icons";
import type { Role } from "@/lib/session";
import type messages from "@/messages/en.json";

// "#" links are placeholders until those pages exist.
// `key` is the label's key in the "dashboard.tabs" / "dashboard.sidebar" translations.

// Keys are checked against en.json, so a menu item can't point at a missing label
type TabKey = Exclude<keyof typeof messages.dashboard.tabs, "label">;
type RailKey = Exclude<keyof typeof messages.dashboard.sidebar, "label">;

type Tab = { href: string; key: TabKey };
type RailLink = { href: string; key: RailKey; Icon: React.ComponentType<{ className?: string }> };

export type DashboardNav = {
  // Pill tabs in the top bar
  tabs: Tab[];
  // Icon rail on the left
  links: RailLink[];
  // Pinned to the bottom of the icon rail
  footerLinks: RailLink[];
};

const helpLink: RailLink = { href: "/support", key: "help", Icon: HelpIcon };

export const dashboardNav: Record<Role, DashboardNav> = {
  FARMER: {
    tabs: [
      { href: "/dashboard", key: "dashboard" },
      { href: "/dashboard/diagnose", key: "diagnose" },
      { href: "/dashboard/profile", key: "profile" },
      { href: "#", key: "fields" },
      { href: "#", key: "analytics" },
      { href: "#", key: "reports" },
    ],
    links: [
      { href: "/dashboard", key: "home", Icon: HomeIcon },
      { href: "#", key: "map", Icon: MapIcon },
      { href: "#", key: "crops", Icon: WheatIcon },
      { href: "/dashboard/diagnose", key: "diagnose", Icon: LeafIcon },
      { href: "#", key: "equipment", Icon: TractorIcon },
      { href: "#", key: "livestock", Icon: CowIcon },
      { href: "#", key: "storage", Icon: BarnIcon },
      { href: "#", key: "analytics", Icon: ChartIcon },
    ],
    // Profile takes the old "settings" placeholder's spot so the rail still fits short pages
    footerLinks: [{ href: "/dashboard/profile", key: "profile", Icon: UserIcon }, helpLink],
  },
  EXPERT: {
    tabs: [
      { href: "/expert", key: "questions" },
      { href: "/expert/profile", key: "profile" },
    ],
    links: [
      { href: "/expert", key: "questions", Icon: ChatIcon },
      { href: "/expert/profile", key: "profile", Icon: UserIcon },
    ],
    footerLinks: [helpLink],
  },
  ADMIN: {
    tabs: [
      { href: "/admin", key: "overview" },
      { href: "/admin/users", key: "users" },
      { href: "/admin/market-prices", key: "marketPrices" },
    ],
    links: [
      { href: "/admin", key: "overview", Icon: ShieldIcon },
      { href: "/admin/users", key: "users", Icon: UserIcon },
      { href: "/admin/market-prices", key: "marketPrices", Icon: CoinsIcon },
    ],
    footerLinks: [helpLink],
  },
};
