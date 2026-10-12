import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/icons";

type LogoProps = {
  // "light" for dark backgrounds, "brand" for white backgrounds
  tone?: "light" | "brand";
  className?: string;
  // Shows only the mark on phones, where a crowded bar has no room for the name
  compactOnPhones?: boolean;
};

const toneStyles = {
  light: "text-white",
  brand: "text-brand",
};

export default function Logo({ tone = "light", className = "", compactOnPhones = false }: LogoProps) {
  return (
    <Link
      href="/"
      // Named here because the visible name can be hidden
      aria-label="Agromate"
      className={`flex shrink-0 items-center gap-2 font-semibold ${toneStyles[tone]} ${className}`}
    >
      <LogoMark className="size-7" />
      <span className={compactOnPhones ? "hidden sm:inline" : ""}>Agromate</span>
    </Link>
  );
}
