"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/host/dashboard", label: "Dashboard" },
  { href: "/host/cars", label: "My Cars" },
  { href: "/host/bookings", label: "My Bookings" },
];

export function HostNav({ verified }: { verified: boolean }) {
  const pathname = usePathname();

  // Pending / suspended hosts see only Dashboard — the other links would
  // route through pages that render locked views anyway, but hiding them
  // keeps the UI intent clear.
  const visible = verified ? LINKS : LINKS.slice(0, 1);

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {visible.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container",
            )}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
