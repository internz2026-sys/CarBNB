"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const firstName = name.split(" ")[0];

  return (
    <div className="ml-2 flex flex-1 items-center justify-end gap-3 border-l border-outline-variant/30 pl-4 sm:flex-none sm:pl-6">
      <div className="hidden flex-col items-end sm:flex">
        <span className="text-sm font-bold text-on-surface">Hello, {firstName}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {role}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="size-10 cursor-pointer shadow-[0_8px_28px_rgb(19_27_46_/_0.06)] ring-2 ring-primary ring-offset-2 ring-offset-surface transition-opacity hover:opacity-90">
            <AvatarImage alt={name} className="object-cover" src={imageUrl} />
            <AvatarFallback className="bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-on-surface">{name}</p>
              <p className="text-xs leading-none text-on-surface-variant">{role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link className="flex w-full cursor-pointer items-center" href="/profile">
              <User className="mr-2 size-4" />
              <span>Change details</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              className="flex w-full cursor-pointer items-center text-error focus:text-error"
              href={onLogoutHref}
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
