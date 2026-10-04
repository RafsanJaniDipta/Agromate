import {
  BarnIcon,
  ChartIcon,
  CowIcon,
  HelpIcon,
  HomeIcon,
  LeafIcon,
  MapIcon,
  SettingsIcon,
  TractorIcon,
  WheatIcon,
} from "@/components/icons";

// "#" links are placeholders until those pages exist.
// `key` is the label's key in the "dashboard" translations.

// Pill tabs in the top bar
export const dashboardTabs = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/dashboard/diagnose", key: "diagnose" },
  { href: "#", key: "fields" },
  { href: "#", key: "analytics" },
  { href: "#", key: "reports" },
] as const;

// Icon rail on the left
export const sidebarLinks = [
  { href: "/dashboard", key: "home", Icon: HomeIcon },
  { href: "#", key: "map", Icon: MapIcon },
  { href: "#", key: "crops", Icon: WheatIcon },
  { href: "/dashboard/diagnose", key: "diagnose", Icon: LeafIcon },
  { href: "#", key: "equipment", Icon: TractorIcon },
  { href: "#", key: "livestock", Icon: CowIcon },
  { href: "#", key: "storage", Icon: BarnIcon },
  { href: "#", key: "analytics", Icon: ChartIcon },
] as const;

// Pinned to the bottom of the icon rail
export const sidebarFooterLinks = [
  { href: "#", key: "settings", Icon: SettingsIcon },
  { href: "/support", key: "help", Icon: HelpIcon },
] as const;
