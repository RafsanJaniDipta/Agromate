import Image from "next/image";
import { cookies } from "next/headers";
import { resolveLocale } from "@/i18n/params";
import { getDashboard } from "@/lib/dashboard";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

// Shared shell for every dashboard section: blurred farm photo, top bar and icon rail.
export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  await resolveLocale(params);
  const cookieStore = await cookies();
  // Cached per request, so the home page reusing this data costs no extra fetch
  const { unreadNotifications } = await getDashboard(cookieStore.toString());

  return (
    <div className="relative isolate min-h-svh bg-zinc-950 p-3 text-white md:p-5">
      {/* Blurred farm photo behind the glass cards; fixed so it stays put while scrolling */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/banners/hero-poster.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          className="scale-110 object-cover blur-2xl"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Desktop: the top bar sticks to the top while scrolling, on a frosted strip that
          spans the full width (negative margins cancel the page padding) */}
      <div className="md:sticky md:top-0 md:z-30 md:-mx-5 md:-mt-5 md:border-b md:border-white/10 md:bg-black/30 md:px-5 md:py-4 md:backdrop-blur-xl">
        <div className="mx-auto max-w-[90rem]">
          <DashboardTopBar unreadNotifications={unreadNotifications} />
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-[90rem] gap-5">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
