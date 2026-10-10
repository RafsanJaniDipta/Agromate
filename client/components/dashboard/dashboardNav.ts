import {
  BulbIcon,
  ChartIcon,
  CloudSunIcon,
  CoinsIcon,
  ExpertIcon,
  HelpIcon,
  HomeIcon,
  LeafIcon,
  MapIcon,
  MessagesIcon,
  QuoteIcon,
  ShieldIcon,
  SparkIcon,
  SproutIcon,
  TagIcon,
  UserIcon,
  WheatIcon,
} from "@/components/icons";
import type { Role } from "@/lib/session";
import type messages from "@/messages/en.json";

// The sidebar is the dashboard's only menu (a drawer on phones).
// `key` is the label's key in the "dashboard.sidebar" translations.
// The "messages" link also shows the unread chat count.

// Keys are checked against en.json, so a menu item can't point at a missing label
type RailKey = Exclude<keyof typeof messages.dashboard.sidebar, "label" | "menu" | "closeMenu">;

export type RailLink = { href: string; key: RailKey; Icon: React.ComponentType<{ className?: string }> };

export type DashboardNav = {
  // Main links, top of the rail
  links: RailLink[];
  // Pinned to the bottom of the rail
  footerLinks: RailLink[];
};

const helpLink: RailLink = { href: "/support", key: "help", Icon: HelpIcon };

export const dashboardNav: Record<Role, DashboardNav> = {
  FARMER: {
    links: [
      { href: "/dashboard", key: "home", Icon: HomeIcon },
      { href: "/dashboard/fields", key: "fields", Icon: MapIcon },
      { href: "/dashboard/my-crops", key: "myCrops", Icon: WheatIcon },
      { href: "/dashboard/accounts", key: "accounts", Icon: CoinsIcon },
      { href: "/dashboard/crops", key: "cropGuide", Icon: SproutIcon },
      { href: "/dashboard/advice", key: "advice", Icon: BulbIcon },
      { href: "/dashboard/weather", key: "weather", Icon: CloudSunIcon },
      { href: "/dashboard/market", key: "market", Icon: TagIcon },
      { href: "/dashboard/analytics", key: "analytics", Icon: ChartIcon },
      { href: "/dashboard/diagnose", key: "diagnose", Icon: LeafIcon },
      { href: "/dashboard/assistant", key: "assistant", Icon: SparkIcon },
      { href: "/dashboard/experts", key: "experts", Icon: ExpertIcon },
      { href: "/dashboard/messages", key: "messages", Icon: MessagesIcon },
      { href: "/dashboard/stories", key: "stories", Icon: QuoteIcon },
    ],
    footerLinks: [{ href: "/dashboard/profile", key: "profile", Icon: UserIcon }, helpLink],
  },
  EXPERT: {
    links: [
      { href: "/expert", key: "overview", Icon: HomeIcon },
      { href: "/expert/messages", key: "messages", Icon: MessagesIcon },
      { href: "/expert/profile", key: "profile", Icon: UserIcon },
    ],
    footerLinks: [helpLink],
  },
  ADMIN: {
    links: [
      { href: "/admin", key: "overview", Icon: ShieldIcon },
      { href: "/admin/messages", key: "messages", Icon: MessagesIcon },
      { href: "/admin/users", key: "users", Icon: UserIcon },
      { href: "/admin/crops", key: "crops", Icon: WheatIcon },
      { href: "/admin/market-prices", key: "marketPrices", Icon: CoinsIcon },
      { href: "/admin/stories", key: "successStories", Icon: QuoteIcon },
    ],
    footerLinks: [helpLink],
  },
};
