"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileDropdownProps {
  name: string;
  role: string;
  imageUrl?: string;
  onLogoutHref?: string;
}

export function UserProfileDropdown({
  name,
  role,
  imageUrl,
  onLogoutHref = "/login",
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const firstName = name.split(" ")[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="ml-2 flex flex-1 items-center justify-end gap-3 border-l border-outline-variant/30 pl-4 sm:flex-none sm:pl-6">
      <div className="hidden flex-col items-end sm:flex">
        <span className="text-sm font-bold text-on-surface">Hello, {firstName}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {role}
        </span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          <Avatar className="size-10 cursor-pointer shadow-[0_8px_28px_rgb(19_27_46_/_0.06)] ring-2 ring-primary ring-offset-2 ring-offset-surface transition-opacity hover:opacity-90">
            <AvatarImage alt={name} className="object-cover" src={imageUrl} />
            <AvatarFallback className="bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 text-sm font-medium">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-on-surface">{name}</p>
                <p className="text-xs leading-none text-on-surface-variant">{role}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-border" />
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <User className="mr-2 size-4" />
              <span>Change details</span>
            </Link>
            <Link
              href={onLogoutHref}
              onClick={() => setIsOpen(false)}
              className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-error transition-colors hover:bg-error/10 hover:text-error focus:text-error"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
