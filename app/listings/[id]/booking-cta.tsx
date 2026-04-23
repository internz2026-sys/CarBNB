"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListingStatus } from "@/types";
import { createBookingAction, type BookingActionState } from "@/app/actions/bookings";
import { calculateBookingAmount } from "@/lib/platform-settings";
import { findRangeConflicts } from "@/lib/availability";
import { format, parseISO } from "date-fns";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function BookingCTA({
  commissionRate,
  dailyPrice,
  listingId,
  listingStatus,
  unavailableDates,
  viewerKind,
}: {
  commissionRate: number;
  dailyPrice: number;
  listingId: string;
  listingStatus: string;
  unavailableDates: string[];
  viewerKind: "guest" | "customer" | "other";
}) {
  const listingBookable = listingStatus === ListingStatus.ACTIVE;

  // Guest or wrong-role viewer: show simplified CTA that redirects or explains.
  if (!listingBookable) {
    return (
      <FixedBar>
        <div className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-surface-container-highest px-6 text-sm font-semibold text-on-surface-variant">
          This listing is not currently available for booking.
        </div>
      </FixedBar>
    );
  }

  if (viewerKind === "guest") {
    return (
      <FixedBar>
        <Link
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[1rem] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-6 font-headline text-base font-bold text-on-primary shadow-[0_12px_28px_rgb(0_82_204_/_0.2)] transition hover:opacity-95"
          href={`/login?redirectTo=${encodeURIComponent(`/listings/${listingId}`)}`}
        >
          <CalendarDays className="size-5" />
          Log in to Reserve
        </Link>
      </FixedBar>
    );
  }

  if (viewerKind === "other") {
    return (
      <FixedBar>
        <div className="flex h-14 w-full items-center justify-center rounded-[1rem] bg-surface-container-highest px-6 text-xs font-semibold text-on-surface-variant sm:text-sm">
          This account isn&apos;t set up as a customer. Use a customer account to reserve.
        </div>
      </FixedBar>
    );
  }

  return (
    <CustomerBookingDialog
      commissionRate={commissionRate}
      dailyPrice={dailyPrice}
      listingId={listingId}
      unavailableDates={unavailableDates}
    />
  );
}

function FixedBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[rgb(255_255_255_/_0.8)] shadow-[0_-4px_24px_rgb(19_27_46_/_0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5 sm:px-6">
        <div className="flex-1">{children}</div>
        <button
          aria-label="Save listing"
          className="grid size-14 place-items-center rounded-[1rem] bg-surface-container-highest text-primary transition hover:scale-[1.02]"
          type="button"
        >
          <Heart className="size-5" />
        </button>
      </div>
    </div>
  );
}

function CustomerBookingDialog({
  commissionRate,
  dailyPrice,
  listingId,
  unavailableDates,
}: {
  commissionRate: number;
  dailyPrice: number;
  listingId: string;
  unavailableDates: string[];
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    createBookingAction,
    null,
  );

  const disabledDates = useMemo(() => {
    const past = { before: new Date(new Date().setHours(0, 0, 0, 0)) };
    const blocked = unavailableDates.map((iso) => new Date(iso));
    return [past, ...blocked];
  }, [unavailableDates]);

  const conflicts = useMemo(() => {
    if (!range?.from || !range?.to) return [];
    return findRangeConflicts(range.from, range.to, unavailableDates);
  }, [range, unavailableDates]);

  const preview = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    if (conflicts.length > 0) return null;
    return calculateBookingAmount(dailyPrice, range.from, range.to, commissionRate);
  }, [dailyPrice, range, conflicts.length, commissionRate]);

  const pickupISO = range?.from ? toDateString(range.from) : "";
  const returnISO = range?.to ? toDateString(range.to) : "";

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <FixedBar>
        <DialogTrigger
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[1rem] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-6 font-headline text-base font-bold text-on-primary shadow-[0_12px_28px_rgb(0_82_204_/_0.2)] transition hover:opacity-95"
          type="button"
        >
          <CalendarDays className="size-5" />
          Reserve Now
        </DialogTrigger>
      </FixedBar>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve this car</DialogTitle>
          <DialogDescription>
            Pick your rental dates. We&apos;ll hold the booking as pending until the admin
            confirms.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input name="listingId" type="hidden" value={listingId} />
          <input name="pickupDate" type="hidden" value={pickupISO} />
          <input name="returnDate" type="hidden" value={returnISO} />

          {state?.error ? (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="flex justify-center rounded-lg border border-border">
            <Calendar
              disabled={disabledDates}
              mode="range"
              numberOfMonths={1}
              onSelect={setRange}
              selected={range}
            />
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            {conflicts.length > 0 ? (
              <div className="text-xs text-red-700">
                <p className="font-semibold">Your selection crosses unavailable days:</p>
                <p className="mt-1">
                  {conflicts
                    .slice(0, 5)
                    .map((key) => format(parseISO(key), "MMM d"))
                    .join(", ")}
                  {conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : ""}
                </p>
                <p className="mt-2 text-red-600">
                  Shorten your range or split it into two separate bookings.
                </p>
              </div>
            ) : preview ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {preview.days} {preview.days === 1 ? "day" : "days"} × {peso.format(dailyPrice)}
                  </span>
                  <span className="font-semibold">{peso.format(preview.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Platform fee (included)</span>
                  <span>{peso.format(preview.platformFee)}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">You pay</span>
                  <span className="text-lg font-bold text-primary">
                    {peso.format(preview.totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Cash on pickup. Admin will confirm availability and contact you.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Select a pickup and return date to see your total.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button disabled={!preview || pending} type="submit">
              {pending ? "Reserving..." : "Confirm Reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
