// Home page sections, reachable from any page
const homeSection = (hash: string) => ({ pathname: "/", hash });

// Main menu, shared by the desktop pill menu and the mobile bottom sheet.
// `key` is the label's key in the "nav" translations.
export const navLinks = [
  { href: "/", key: "home" },
  { href: homeSection("services"), key: "services" },
  { href: homeSection("stories"), key: "stories" },
  { href: "/experts", key: "experts" },
  { href: "/about", key: "about" },
  { href: "/support", key: "support" },
] as const;
