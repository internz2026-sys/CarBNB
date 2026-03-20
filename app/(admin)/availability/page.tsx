"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Ban,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Ellipsis,
  History,
  MapPin,
  MessageSquareText,
  PencilLine,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  availabilityExceptions,
  availabilityRules,
  bookings,
  carListings,
} from "@/lib/data/mock-data";
import { DayOfWeek } from "@/types";
import { cn } from "@/lib/utils";

const DAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function formatCompactTime(value?: string) {
  if (!value) {
    return "--";
  }

  const [hours, minutes] = value.split(":").map(Number);
  return format(new Date(2026, 0, 1, hours, minutes), minutes === 0 ? "ha" : "h:mma");
}

function getRecurringSummary(carId: string) {
  const carRules = availabilityRules.filter((rule) => rule.carListingId === carId);
  const availableRules = DAYS_ORDER.map((day) =>
    carRules.find((rule) => rule.dayOfWeek === day && rule.isAvailable)
  ).filter(Boolean);

  if (availableRules.length === 0) {
    return "No recurring schedule";
  }

  const firstRule = availableRules[0];
  const sameTime = availableRules.every(
    (rule) =>
      rule?.startTime === firstRule?.startTime && rule?.endTime === firstRule?.endTime
  );

  let dayLabel = "Custom";

  if (availableRules.length === 7) {
    dayLabel = "Daily";
  } else if (availableRules.length === 5) {
    const weekdayOnly = availableRules.every((rule) =>
      [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ].includes(rule.dayOfWeek)
    );

    dayLabel = weekdayOnly ? "Mon-Fri" : "5 days";
  } else if (availableRules.length === 1) {
    dayLabel = availableRules[0].dayOfWeek.slice(0, 3);
  } else {
    dayLabel = `${availableRules[0].dayOfWeek.slice(0, 3)}-${availableRules[
      availableRules.length - 1
    ].dayOfWeek.slice(0, 3)}`;
  }

  if (!sameTime || !firstRule?.startTime || !firstRule.endTime) {
    return `${dayLabel} schedule`;
  }

  return `${dayLabel} ${formatCompactTime(firstRule.startTime)}-${formatCompactTime(firstRule.endTime)}`;
}

function getInitialFocusDate(carId: string) {
  const firstBooking = bookings
    .filter((booking) => booking.carListingId === carId)
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))[0];

  if (firstBooking) {
    return parseISO(firstBooking.pickupDate);
  }

  const firstException = availabilityExceptions
    .filter((exception) => exception.carListingId === carId)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (firstException) {
    return parseISO(firstException.date);
  }

  return new Date();
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AvailabilityPage() {
  const [selectedCarId, setSelectedCarId] = useState<string>(carListings[0].id);
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialFocusDate(carListings[0].id));
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(getInitialFocusDate(carListings[0].id))
  );
  const [recurringEnabled, setRecurringEnabled] = useState<boolean>(true);

  const handleSelectCar = (carId: string) => {
    const focusDate = getInitialFocusDate(carId);
    setSelectedCarId(carId);
    setSelectedDate(focusDate);
    setCurrentMonth(startOfMonth(focusDate));
    setRecurringEnabled(
      availabilityRules.some(
        (rule) => rule.carListingId === carId && rule.isAvailable
      )
    );
  };

  const selectedCar = carListings.find((car) => car.id === selectedCarId) ?? carListings[0];
  const carRules = availabilityRules.filter((rule) => rule.carListingId === selectedCarId);
  const carExceptions = availabilityExceptions.filter(
    (exception) => exception.carListingId === selectedCarId
  );
  const carBookings = bookings.filter((booking) => booking.carListingId === selectedCarId);

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  const selectedBooking = carBookings.find((booking) =>
    isWithinInterval(selectedDate, {
      start: parseISO(booking.pickupDate),
      end: parseISO(booking.returnDate),
    })
  );

  const selectedException = carExceptions.find(
    (exception) =>
      !exception.isAvailable && isSameDay(parseISO(exception.date), selectedDate)
  );

  const selectedRule = carRules.find(
    (rule) => rule.dayOfWeek === format(selectedDate, "EEEE")
  );

  const monthLabel = format(currentMonth, "MMMM yyyy");
  const recurringSummary = getRecurringSummary(selectedCarId);

  const handleMonthShift = (direction: "prev" | "next") => {
    const nextMonth =
      direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);

    setCurrentMonth(nextMonth);

    if (!isSameMonth(selectedDate, nextMonth)) {
      setSelectedDate(startOfMonth(nextMonth));
    }
  };

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-container)_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
      <div className="space-y-10">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 lg:col-span-6">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface xl:text-[3.5rem] xl:leading-none">
              Availability Calendar
            </h1>
            <p className="mt-2 text-base font-medium text-on-surface-variant sm:text-lg">
              Manage listing schedules and booking blocks for your fleet.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-wrap justify-end gap-4">
            <div className="flex min-w-[260px] flex-col gap-1.5">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-outline">
                Active Vehicle
              </label>
              <Popover>
                <PopoverTrigger className="w-full rounded-xl bg-surface-container-lowest p-2 pl-4 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)] outline-none transition hover:bg-surface">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 overflow-hidden rounded-lg">
                      <Image
                        alt={`${selectedCar.brand} ${selectedCar.model}`}
                        className="object-cover"
                        fill
                        src={selectedCar.photos[0]}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-bold text-on-surface">
                        {selectedCar.brand} {selectedCar.model}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        Fleet ID: {selectedCar.id}
                      </div>
                    </div>
                    <ChevronDown className="size-4 text-outline" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[320px] rounded-2xl bg-surface-container-lowest p-2 shadow-[0_12px_40px_rgb(19_27_46_/_0.08)] ring-0"
                >
                  <div className="space-y-1">
                    {carListings.map((car) => (
                      <button
                        key={car.id}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                          car.id === selectedCarId
                            ? "bg-surface-container-highest"
                            : "hover:bg-surface-container-low"
                        )}
                        onClick={() => handleSelectCar(car.id)}
                        type="button"
                      >
                        <div className="relative size-12 overflow-hidden rounded-lg">
                          <Image
                            alt={`${car.brand} ${car.model}`}
                            className="object-cover"
                            fill
                            src={car.photos[0]}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-on-surface">
                            {car.brand} {car.model}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                            {car.plateNumber}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {peso.format(car.dailyPrice)}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-outline">
                Recurring Schedule
              </label>
              <div className="flex h-14 items-center gap-3 rounded-xl bg-surface-container-highest px-4 shadow-[0_8px_28px_rgb(19_27_46_/_0.04)]">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {recurringEnabled ? recurringSummary : "Recurring schedule disabled"}
                </span>
                <Switch
                  checked={recurringEnabled}
                  className="ml-auto"
                  onCheckedChange={(checked) => setRecurringEnabled(checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-tertiary-fixed" />
              <span className="text-xs font-semibold text-on-surface-variant">
                Available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-primary-container" />
              <span className="text-xs font-semibold text-on-surface-variant">
                Booked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-outline-variant" />
              <span className="text-xs font-semibold text-on-surface-variant">
                Blocked
              </span>
            </div>
          </div>

          <div className="flex items-center rounded-full bg-surface-container-lowest p-1 shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
            <button
              className="rounded-full p-2 transition hover:bg-surface-container"
              onClick={() => handleMonthShift("prev")}
              type="button"
            >
              <ChevronLeft className="size-5 text-on-surface" />
            </button>
            <span className="px-4 font-headline text-lg font-bold text-on-surface">
              {monthLabel}
            </span>
            <button
              className="rounded-full p-2 transition hover:bg-surface-container"
              onClick={() => handleMonthShift("next")}
              type="button"
            >
              <ChevronRight className="size-5 text-on-surface" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 xl:col-span-8 rounded-[2rem] bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
            <div className="mb-4 grid grid-cols-7 gap-4">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-bold text-outline"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {monthDays.map((date) => {
                const outsideMonth = !isSameMonth(date, currentMonth);
                const booking = carBookings.find((entry) =>
                  isWithinInterval(date, {
                    start: parseISO(entry.pickupDate),
                    end: parseISO(entry.returnDate),
                  })
                );
                const exception = carExceptions.find(
                  (entry) =>
                    !entry.isAvailable && isSameDay(parseISO(entry.date), date)
                );
                const rule = carRules.find(
                  (entry) => entry.dayOfWeek === format(date, "EEEE")
                );
                const isAvailableByRule = recurringEnabled
                  ? Boolean(rule?.isAvailable)
                  : true;

                let toneClass =
                  "bg-surface-container-low text-on-surface-variant";
                let helperLabel = "";

                if (booking) {
                  toneClass = "bg-primary-container text-primary";
                  helperLabel = isSameDay(date, parseISO(booking.pickupDate))
                    ? "Booked"
                    : "";
                } else if (exception) {
                  toneClass = "bg-outline-variant/50 text-on-surface-variant";
                  helperLabel = "Blocked";
                } else if (isAvailableByRule) {
                  toneClass = "bg-tertiary-fixed text-on-tertiary-fixed";
                }

                if (outsideMonth) {
                  return (
                    <div
                      key={date.toISOString()}
                      className="aspect-square rounded-2xl bg-surface-container-low/30"
                    />
                  );
                }

                return (
                  <button
                    key={date.toISOString()}
                    className={cn(
                      "group relative aspect-square rounded-2xl p-3 text-left transition-transform hover:scale-[1.02]",
                      toneClass,
                      isSameDay(date, selectedDate) &&
                        "shadow-[inset_0_0_0_2px_var(--color-primary)] ring-2 ring-primary/20"
                    )}
                    onClick={() => setSelectedDate(date)}
                    type="button"
                  >
                    <span className="text-sm font-bold">{format(date, "d")}</span>

                    {helperLabel ? (
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] opacity-80">
                        {helperLabel}
                      </div>
                    ) : null}

                    {!booking && !exception && isAvailableByRule && isSameDay(date, selectedDate) ? (
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-on-tertiary-fixed/80">
                        {rule?.startTime ? `${formatCompactTime(rule.startTime)} start` : "Open"}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-highest p-8 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
              <div className="absolute -right-16 -top-16 size-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative z-10">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="font-headline text-xl font-bold text-on-surface">
                    {selectedBooking
                      ? "Booking Details"
                      : selectedException
                        ? "Blocked Date"
                        : "Availability Snapshot"}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]",
                      selectedBooking
                        ? "bg-primary/10 text-primary"
                        : selectedException
                          ? "bg-error-container text-on-error-container"
                          : selectedRule?.isAvailable && recurringEnabled
                            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                            : "bg-surface-container-low text-on-surface-variant"
                    )}
                  >
                    {selectedBooking
                      ? selectedBooking.status
                      : selectedException
                        ? "Blocked"
                        : selectedRule?.isAvailable && recurringEnabled
                          ? "Available"
                          : "Unavailable"}
                  </span>
                </div>

                <div className="mb-8 flex items-center gap-4">
                  <div
                    className={cn(
                      "grid size-14 place-items-center rounded-full text-sm font-semibold shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]",
                      selectedBooking
                        ? "bg-primary text-on-primary"
                        : selectedException
                          ? "bg-error-container text-on-error-container"
                          : "bg-surface-container-lowest text-primary"
                    )}
                  >
                    {selectedBooking
                      ? getInitials(selectedBooking.customerName)
                      : selectedException
                        ? "BL"
                        : getInitials(`${selectedCar.brand} ${selectedCar.model}`)}
                  </div>
                  <div>
                    <div className="font-headline text-lg font-extrabold leading-tight text-on-surface">
                      {selectedBooking
                        ? selectedBooking.customerName
                        : selectedException
                          ? "Manual Calendar Override"
                          : `${selectedCar.brand} ${selectedCar.model}`}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {selectedBooking
                        ? `${selectedCar.brand} ${selectedCar.model}`
                        : selectedException
                          ? selectedException.reason || "Blocked by admin action"
                          : recurringEnabled
                            ? recurringSummary
                            : "Recurring schedule disabled"}
                    </div>
                  </div>
                </div>

                <div className="mb-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <CalendarDays className="mt-0.5 size-5 text-primary" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-outline">
                        {selectedBooking ? "Duration" : "Date"}
                      </div>
                      <div className="text-sm font-semibold text-on-surface">
                        {selectedBooking
                          ? `${format(parseISO(selectedBooking.pickupDate), "MMM d")} - ${format(
                              parseISO(selectedBooking.returnDate),
                              "MMM d, yyyy"
                            )}`
                          : format(selectedDate, "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="mt-0.5 size-5 text-primary" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-outline">
                        {selectedBooking ? "Pickup Point" : "Vehicle Location"}
                      </div>
                      <div className="text-sm font-semibold text-on-surface">
                        {selectedCar.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    {selectedBooking ? (
                      <Banknote className="mt-0.5 size-5 text-primary" />
                    ) : (
                      <Clock3 className="mt-0.5 size-5 text-primary" />
                    )}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-outline">
                        {selectedBooking
                          ? "Total Revenue"
                          : selectedException
                            ? "Reason"
                            : "Schedule Window"}
                      </div>
                      <div className="text-sm font-semibold text-on-surface">
                        {selectedBooking
                          ? peso.format(selectedBooking.totalAmount)
                          : selectedException
                            ? selectedException.reason || "Blocked for admin review"
                            : selectedRule?.isAvailable && recurringEnabled
                              ? `${formatCompactTime(selectedRule.startTime)} - ${formatCompactTime(
                                  selectedRule.endTime
                                )}`
                              : "Unavailable on this day"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {selectedBooking ? (
                    <>
                      <button
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-4 py-3 text-xs font-bold text-on-primary transition hover:opacity-95"
                        type="button"
                      >
                        <MessageSquareText className="size-4" />
                        Contact Driver
                      </button>
                      <button
                        className="rounded-xl bg-surface-container-lowest px-3 text-on-surface shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] transition hover:bg-surface"
                        type="button"
                      >
                        <Ellipsis className="size-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-4 py-3 text-xs font-bold text-on-primary transition hover:opacity-95"
                        href={`/car-listings/${selectedCar.id}`}
                      >
                        <CalendarDays className="size-4" />
                        View Listing
                      </Link>
                      <button
                        className="rounded-xl bg-surface-container-lowest px-3 text-on-surface shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] transition hover:bg-surface"
                        type="button"
                      >
                        <Ellipsis className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
              <h3 className="mb-4 font-headline text-lg font-bold text-on-surface">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-4 transition hover:bg-surface-container"
                  type="button"
                >
                  <Ban className="size-5 text-outline transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Block Dates
                  </span>
                </button>
                <button
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-4 transition hover:bg-surface-container"
                  type="button"
                >
                  <PencilLine className="size-5 text-outline transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Edit Rates
                  </span>
                </button>
                <button
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-4 transition hover:bg-surface-container"
                  type="button"
                >
                  <Download className="size-5 text-outline transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Export iCal
                  </span>
                </button>
                <button
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-4 transition hover:bg-surface-container"
                  type="button"
                >
                  <History className="size-5 text-outline transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    History
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
