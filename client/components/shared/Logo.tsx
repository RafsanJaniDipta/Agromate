import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/icons";

type LogoProps = {
  // "light" for dark backgrounds, "brand" for white backgrounds
  tone?: "light" | "brand";
  className?: string;
};

const toneStyles = {
  light: "text-white",
  brand: "text-brand",
};

export default function Logo({ tone = "light", className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-semibold ${toneStyles[tone]} ${className}`}
    >
      <LogoMark className="size-7" />
      <span>Agromate</span>
    </Link>
  );
}
