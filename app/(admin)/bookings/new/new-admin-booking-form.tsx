"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  createAdminBookingAction,
  type AdminBookingActionState,
} from "@/app/actions/admin-bookings";
import { calculateBookingAmount } from "@/lib/platform-settings";
import { findRangeConflicts } from "@/lib/availability";
import { format, parseISO } from "date-fns";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

type CustomerOption = { id: string; fullName: string; email: string };
type ListingOption = {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  dailyPrice: number;
};

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function NewAdminBookingForm({
  commissionRate,
  customers,
  listings,
  unavailableByListing,
}: {
  commissionRate: number;
  customers: CustomerOption[];
  listings: ListingOption[];
  unavailableByListing: Record<string, string[]>;
}) {
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id ?? "");
  const [listingId, setListingId] = useState<string>(listings[0]?.id ?? "");
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const [state, formAction, pending] = useActionState<
    AdminBookingActionState,
    FormData
  >(createAdminBookingAction, null);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedListing = listings.find((l) => l.id === listingId);

  const disabledDates = useMemo(() => {
    const past = { before: new Date(new Date().setHours(0, 0, 0, 0)) };
    const listingDates = (unavailableByListing[listingId] ?? []).map(
      (iso) => new Date(iso),
    );
    return [past, ...listingDates];
  }, [listingId, unavailableByListing]);

  const conflicts = useMemo(() => {
    if (!range?.from || !range?.to) return [];
    return findRangeConflicts(
      range.from,
      range.to,
      unavailableByListing[listingId] ?? [],
    );
  }, [range, listingId, unavailableByListing]);

  const preview = useMemo(() => {
    if (!selectedListing || !range?.from || !range?.to) return null;
    if (conflicts.length > 0) return null;
    return calculateBookingAmount(
      selectedListing.dailyPrice,
      range.from,
      range.to,
      commissionRate,
    );
  }, [selectedListing, range, conflicts.length, commissionRate]);

  const pickupISO = range?.from ? toDateString(range.from) : "";
  const returnISO = range?.to ? toDateString(range.to) : "";

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  if (customers.length === 0) {
    return (
      <div className="rounded-[1rem] bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">No customers yet.</p>
        <p className="mt-1">
          Bookings require a customer account. Ask the user to sign up first via{" "}
          <Link className="underline" href="/signup">
            /signup
          </Link>
          .
        </p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-[1rem] bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">No active listings yet.</p>
        <p className="mt-1">
          Approve a listing first via the{" "}
          <Link className="underline" href="/car-listings">
            Car Listings
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input name="customerId" type="hidden" value={customerId} />
      <input name="listingId" type="hidden" value={listingId} />
      <input name="pickupDate" type="hidden" value={pickupISO} />
      <input name="returnDate" type="hidden" value={returnISO} />

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Customer & Vehicle</CardTitle>
          <CardDescription>
            Who is booking, and which vehicle do you want to reserve for them?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              onValueChange={(v) => {
                if (v) setCustomerId(v);
              }}
              value={customerId}
            >
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {selectedCustomer
                    ? `${selectedCustomer.fullName} — ${selectedCustomer.email}`
                    : "Select customer"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.fullName}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("customerId") ? (
              <p className="text-xs text-red-600">{fieldError("customerId")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select
              onValueChange={(v) => {
                if (v) {
                  setListingId(v);
                  setRange(undefined); // reset dates on vehicle switch
                }
              }}
              value={listingId}
            >
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {selectedListing
                    ? `${selectedListing.brand} ${selectedListing.model} · ${selectedListing.plateNumber} · ${peso.format(selectedListing.dailyPrice)}/day`
                    : "Select vehicle"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {l.brand} {l.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {l.plateNumber} · {peso.format(l.dailyPrice)}/day
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("listingId") ? (
              <p className="text-xs text-red-600">{fieldError("listingId")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rental Dates</CardTitle>
          <CardDescription>
            Pick pickup and return from the calendar. Dates blocked by existing bookings,
            weekly schedule gaps, or exceptions on the selected vehicle are greyed out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center rounded-lg border border-border">
            <Calendar
              disabled={disabledDates}
              mode="range"
              numberOfMonths={1}
              onSelect={setRange}
              selected={range}
            />
          </div>
          {!range?.from || !range?.to ? (
            <p className="text-center text-xs text-muted-foreground">
              Select a pickup and return date to continue.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conflicts.length > 0 ? (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold">Your selection crosses unavailable days:</p>
              <p className="mt-1">
                {conflicts
                  .slice(0, 5)
                  .map((key) => format(parseISO(key), "MMM d"))
                  .join(", ")}
                {conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : ""}
              </p>
              <p className="mt-2 text-red-600">
                Shorten the range or split into two separate bookings.
              </p>
            </div>
          ) : preview && selectedListing ? (
            <div className="rounded-lg bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {preview.days} {preview.days === 1 ? "day" : "days"} × {peso.format(selectedListing.dailyPrice)}
                </span>
                <span className="font-semibold">{peso.format(preview.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Platform fee</span>
                <span>{peso.format(preview.platformFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Owner payout</span>
                <span>{peso.format(preview.ownerPayout)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Customer total</span>
                <span className="text-lg font-bold text-primary">
                  {peso.format(preview.totalAmount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a vehicle and valid dates to see the fee preview.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              className="resize-none h-24"
              id="notes"
              name="notes"
              placeholder="Internal notes visible to admin (pickup time, special requests, etc.)"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Link className={buttonVariants({ variant: "outline" })} href="/bookings">
            Cancel
          </Link>
          <Button disabled={pending || !preview} type="submit">
            {pending ? "Creating..." : "Create Confirmed Booking"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
