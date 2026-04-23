"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  CalendarDays,
  CalendarRange,
  CarFront,
  LayoutDashboard,
  Settings2,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Owners", href: "/owners", icon: Users },
  { label: "Car Listings", href: "/car-listings", icon: CarFront },
  { label: "Availability", href: "/availability", icon: CalendarDays },
  { label: "Calendar", href: "/calendar", icon: CalendarRange },
  { label: "Bookings", href: "/bookings", icon: BookOpenText },
  { label: "Customers", href: "/customers", icon: UserRound },
  { label: "Accounting", href: "/accounting", icon: WalletCards },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              compact
                ? "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition"
                : "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-all",
              isActive
                ? compact
                  ? "bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] text-on-primary shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                  : "bg-surface-container-lowest text-primary shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                : compact
                  ? "bg-surface/80 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <span
              className={cn(
                compact
                  ? "grid size-7 place-items-center rounded-full"
                  : "grid size-9 place-items-center rounded-lg transition",
                isActive
                  ? compact
                    ? "bg-white/15"
                    : "bg-primary-fixed text-primary"
                  : "bg-surface/80 text-on-surface-variant group-hover:bg-surface-container-highest group-hover:text-primary"
              )}
            >
              <Icon className={compact ? "size-3.5" : "size-4"} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[18rem] flex-col bg-[rgb(210_217_244_/_0.78)] px-6 py-6 backdrop-blur-[12px] xl:flex">
      <div className="mb-6">
        <span className="font-headline text-[1.65rem] font-semibold tracking-tight text-primary">
          Admin Panel
        </span>
        <p className="mt-0.5 text-sm text-on-surface-variant">The Curated Engine</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        <NavLinks />
      </nav>

      <div className="mt-4 rounded-[1rem] bg-surface-container-lowest/80 p-3 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[0.75rem] bg-surface-container-highest text-sm font-semibold text-primary">
            AR
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">Alex Rivera</p>
            <p className="text-xs text-on-surface-variant">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileAdminNav() {
  return (
    <div className="mb-6 xl:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavLinks compact />
      </div>
    </div>
  );
}
