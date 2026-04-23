"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

type MenuLink = { label: string; href: string };

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

export function UserMenu({
  fullName,
  links = [],
  roleLabel,
}: {
  fullName: string;
  links?: MenuLink[];
  roleLabel?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-transparent bg-surface-container-lowest px-2 py-1 text-sm font-semibold text-on-surface shadow-[0_4px_16px_rgb(19_27_46_/_0.05)]",
          "hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary text-on-primary text-xs font-bold">
          {initialsOf(fullName)}
        </span>
        <span className="hidden max-w-[10rem] truncate pr-1 sm:inline">{fullName}</span>
        <ChevronDown className="size-4 text-on-surface-variant" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="min-w-[14rem] rounded-xl bg-surface-container-lowest p-1 shadow-[0_12px_40px_rgb(19_27_46_/_0.08)] ring-1 ring-foreground/5 outline-none"
        sideOffset={6}
      >
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-sm font-semibold text-on-surface truncate">{fullName}</p>
          {roleLabel ? (
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              {roleLabel}
            </p>
          ) : null}
        </div>
        <div className="py-1">
          {links.map((link) => (
            <Link
              className="flex items-center rounded-md px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <form action={logoutAction} className="border-t border-border pt-1">
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-on-surface hover:bg-red-50 hover:text-red-700"
            type="submit"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
