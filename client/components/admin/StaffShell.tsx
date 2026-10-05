import { useTranslations } from "next-intl";
import { ShieldIcon } from "@/components/icons";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";

// Plain dark frame for the admin & expert login: no farmer imagery, just the logo and a centred card.
export default function StaffShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");

  return (
    <section className="flex min-h-svh flex-col bg-linear-to-br from-zinc-950 via-emerald-950 to-zinc-900 p-4 text-white md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <LanguageSwitcher />
      </div>

      <div className="m-auto w-full max-w-md animate-blur-in py-10">
        <p className="mb-4 flex items-center justify-center gap-2 text-sm text-white/70">
          <ShieldIcon className="size-4" />
          {t("badge")}
        </p>
        <div className="rounded-3xl bg-zinc-100 p-6 text-zinc-900 md:p-10">{children}</div>
      </div>
    </section>
  );
}
