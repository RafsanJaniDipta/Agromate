import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/shared/Logo";

// Home page sections, reachable from any page
const homeSection = (hash: string) => ({ pathname: "/", hash });

// "#" links are placeholders until those pages exist
const columns = [
  {
    id: "navigation",
    links: [
      { id: "home", href: "/" },
      { id: "services", href: homeSection("services") },
      { id: "whyUs", href: homeSection("why-us") },
      { id: "about", href: "/about" },
      { id: "support", href: "/support" },
    ],
  },
  {
    id: "resources",
    links: [
      { id: "helpCenter", href: "#" },
      { id: "marketPrices", href: "#" },
      { id: "weatherUpdates", href: "#" },
      { id: "farmingGuides", href: "#" },
      { id: "faq", href: "#" },
    ],
  },
  {
    id: "company",
    links: [
      { id: "about", href: "/about" },
      { id: "careers", href: "#" },
      { id: "press", href: "#" },
      { id: "sustainability", href: "#" },
      { id: "contact", href: "/support" },
    ],
  },
] as const;

const legalLinks = [
  { id: "privacy", href: "#" },
  { id: "terms", href: "#" },
] as const;

// Site footer: brand blurb, link columns, legal row and a giant wordmark cropped at the bottom.
export default function Footer() {
  const t = useTranslations("footer");
  const format = useFormatter();
  const year = format.dateTime(new Date(), { year: "numeric" });
  // Set by the CI deploy; shows which commit is live (absent in local dev)
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7);

  return (
    <footer className="bg-white p-2 md:p-3">
      <div className="overflow-hidden rounded-3xl bg-black pt-12 text-white">
        <div className="site-container">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-white/70">{t("blurb")}</p>
            </div>

            {columns.map(({ id, links }) => (
              <nav key={id} aria-label={t(`columns.${id}`)}>
                <h3 className="text-lg font-medium">{t(`columns.${id}`)}</h3>
                <ul className="mt-5 space-y-3 text-sm text-white/70">
                  {links.map((link) => (
                    <li key={link.id}>
                      <Link href={link.href} className="transition hover:text-white">
                        {t(`links.${link.id}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-4 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {t("copyright", { year })}
              {commit && <span className="ml-2 font-mono text-xs text-white/40">v{commit}</span>}
            </p>
            <ul className="flex gap-6">
              {legalLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="transition hover:text-white">
                    {t(`links.${link.id}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Brand name stays in English on every page. Sized to match the container width
            (capped on wide screens); the bottom is clipped by the card */}
        <p
          lang="en"
          aria-hidden="true"
          data-reveal
          className="mb-[-0.18em] mt-8 select-none whitespace-nowrap text-center text-[16vw] font-bold uppercase leading-none tracking-tighter md:text-[min(17vw,15.75rem)]"
        >
          Agromate
        </p>
      </div>
    </footer>
  );
}
