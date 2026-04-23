"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Car, CalendarDays, Filter } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type CarListing = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
};

type BookingEvent = {
  id: string;
  referenceNumber: string;
  carListingId: string;
  customerName: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: number;
};

type ExceptionEvent = {
  id: string;
  carListingId: string;
  date: string;
  isAvailable: boolean;
  reason: string | null;
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function CalendarView({
  carListings,
  bookings,
  exceptions,
}: {
  carListings: CarListing[];
  bookings: BookingEvent[];
  exceptions: ExceptionEvent[];
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCarId, setSelectedCarId] = useState<string>("all");

  const relevantBookings = useMemo(() => {
    if (selectedCarId === "all") return bookings;
    return bookings.filter((b) => b.carListingId === selectedCarId);
  }, [bookings, selectedCarId]);

  const relevantExceptions = useMemo(() => {
    if (selectedCarId === "all") return exceptions;
    return exceptions.filter((e) => e.carListingId === selectedCarId);
  }, [exceptions, selectedCarId]);

  const modifiers = useMemo(
    () => ({
      booked: (d: Date) =>
        relevantBookings.some((b) => {
          const start = parseISO(b.pickupDate);
          const end = parseISO(b.returnDate);
          return d >= start && d <= end;
        }),
      blocked: (d: Date) =>
        relevantExceptions.some((e) => !e.isAvailable && isSameDay(parseISO(e.date), d)),
    }),
    [relevantBookings, relevantExceptions],
  );

  const modifiersStyles = {
    booked: {
      backgroundColor: "rgb(239 246 255)",
      color: "rgb(29 78 216)",
      fontWeight: "bold",
      border: "1px solid rgb(191 219 254)",
    },
    blocked: {
      backgroundColor: "rgb(254 242 242)",
      color: "rgb(185 28 28)",
      fontWeight: "bold",
      textDecoration: "line-through",
      opacity: 0.8,
    },
  };

  const eventsOnDate = useMemo(() => {
    if (!date) return { bookings: [], blocks: [] };
    return {
      bookings: relevantBookings.filter(
        (b) => date >= parseISO(b.pickupDate) && date <= parseISO(b.returnDate),
      ),
      blocks: relevantExceptions.filter((e) => isSameDay(parseISO(e.date), date)),
    };
  }, [date, relevantBookings, relevantExceptions]);

  const selectedCarLabel =
    selectedCarId === "all"
      ? "All Vehicles (Fleet View)"
      : (() => {
          const car = carListings.find((c) => c.id === selectedCarId);
          return car ? `${car.plateNumber} - ${car.model}` : "All Vehicles";
        })();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <PageHeader
        title="Fleet Calendar"
        description="Global view of all car availability, blocked dates, and active bookings."
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
          <Select onValueChange={(val) => val && setSelectedCarId(val)} value={selectedCarId}>
            <SelectTrigger className="w-[220px] bg-background">
              <span className="truncate text-left">{selectedCarLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles (Fleet View)</SelectItem>
              {carListings.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.plateNumber} - {c.brand} {c.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/10 border-b border-border pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                Date Navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              <Calendar
                className="rounded-md border shadow-sm w-[350px] bg-background scale-105 my-4"
                mode="single"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                onSelect={setDate}
                selected={date}
              />
              <div className="w-full mt-6 grid grid-cols-2 gap-3 text-sm px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200" />
                  <span className="text-muted-foreground text-xs">Booked Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                  <span className="text-muted-foreground text-xs">Admin Blocked</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border shadow-sm h-[600px] flex flex-col">
            <CardHeader className="border-b border-border bg-background py-4 flex flex-row items-center justify-between sticky top-0 z-10">
              <div>
                <CardTitle className="text-xl text-foreground font-semibold">
                  {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a Date"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {eventsOnDate.bookings.length} Bookings • {eventsOnDate.blocks.length} Blocks
                </CardDescription>
              </div>
              {selectedCarId !== "all" ? (
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
                    Filtered
                  </span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                    {carListings.find((c) => c.id === selectedCarId)?.plateNumber}
                  </span>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 bg-muted/5">
              {!date || (eventsOnDate.bookings.length === 0 && eventsOnDate.blocks.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Clear Schedule</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    No bookings or blocked dates found for the selected day.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {eventsOnDate.blocks.map((block) => {
                    const car = carListings.find((c) => c.id === block.carListingId);
                    return (
                      <div
                        className="p-4 bg-red-50/50 hover:bg-red-50 transition-colors border-l-4 border-l-red-500"
                        key={block.id}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold uppercase tracking-wider">
                              Blocked
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {format(parseISO(block.date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-red-800/80 mb-3">{block.reason || "No reason provided"}</p>
                        <div className="flex items-center gap-2 text-sm bg-white border border-red-100 w-fit px-3 py-1.5 rounded-md shadow-sm">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {car?.brand} {car?.model}
                          </span>
                          <span className="text-muted-foreground">({car?.plateNumber})</span>
                        </div>
                      </div>
                    );
                  })}

                  {eventsOnDate.bookings.map((booking) => {
                    const car = carListings.find((c) => c.id === booking.carListingId);
                    return (
                      <div
                        className="p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors border-l-4 border-l-blue-500"
                        key={booking.id}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold uppercase tracking-wider">
                              Booking
                            </span>
                            <span className="text-sm font-semibold text-foreground font-mono">
                              {booking.referenceNumber}
                            </span>
                          </div>
                          <Link
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-6 text-xs")}
                            href={`/bookings/${booking.id}`}
                          >
                            View Booking
                          </Link>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                {car?.brand} {car?.model}
                              </span>
                              <span className="text-muted-foreground font-mono text-xs border px-1 rounded bg-muted/50">
                                {car?.plateNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-12 text-xs">Renter:</span>
                              <span className="font-medium">{booking.customerName}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {format(parseISO(booking.pickupDate), "MMM d")} -{" "}
                              {format(parseISO(booking.returnDate), "MMM d")}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {peso.format(booking.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
