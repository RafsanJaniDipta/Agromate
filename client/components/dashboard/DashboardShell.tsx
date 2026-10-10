import Image from "next/image";
import type { Role } from "@/lib/session";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import RoleGate from "@/components/dashboard/RoleGate";
import { ChatUnreadProvider } from "@/components/chat/ChatUnread";
import LiveToasts from "@/components/realtime/LiveToasts";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";

type DashboardShellProps = {
  // Whose dashboard this is: picks the menus and who may open it
  role: Role;
  children: React.ReactNode;
};

// Shared frame for the farmer, expert and admin dashboards: blurred farm photo,
// top bar and icon rail. Everything inside is shown only to the matching role, and keeps
// a live connection for chat and notifications.
export default function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <div className="relative isolate min-h-svh bg-zinc-950 p-3 text-white md:p-5 print:bg-white print:p-0">
      {/* Blurred farm photo behind the glass cards; fixed so it stays put while scrolling */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden print:hidden">
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

      <RoleGate role={role}>
        <RealtimeProvider>
          <ChatUnreadProvider>
            {/* Desktop: the top bar sticks to the top while scrolling, on a frosted strip that
                spans the full width (negative margins cancel the page padding) */}
            <div className="print:hidden md:sticky md:top-0 md:z-30 md:-mx-5 md:-mt-5 md:border-b md:border-white/10 md:bg-black/30 md:px-5 md:py-4 md:backdrop-blur-xl">
              <div className="mx-auto max-w-[90rem]">
                <DashboardTopBar role={role} />
              </div>
            </div>

            <div className="mx-auto mt-5 flex max-w-[90rem] gap-5 print:mt-0">
              <DashboardSidebar role={role} />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
            <LiveToasts />
          </ChatUnreadProvider>
        </RealtimeProvider>
      </RoleGate>
    </div>
  );
}
