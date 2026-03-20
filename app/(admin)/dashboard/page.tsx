import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  FileText,
  IdCard,
  Plus,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats: Array<{
  label: string;
  value: string;
  footnote: string;
  tone: "positive" | "neutral" | "danger";
  icon?: LucideIcon;
}> = [
  {
    label: "Total Owners",
    value: "1,284",
    footnote: "+12% this month",
    tone: "positive",
    icon: TrendingUp,
  },
  {
    label: "Active Listings",
    value: "8,402",
    footnote: "Verified Elite",
    tone: "neutral",
    icon: BadgeCheck,
  },
  {
    label: "Pending Approvals",
    value: "42",
    footnote: "High Priority",
    tone: "danger",
    icon: AlertTriangle,
  },
];

const verificationQueue: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Marcus Thorne",
    description: "License & Identity Check",
    icon: IdCard,
  },
  {
    title: "Vehicle #99283",
    description: "Insurance Policy Review",
    icon: FileText,
  },
];

const bookings = [
  {
    car: "BMW M4 Competition",
    plate: "LX-9022-BNB",
    owner: "Sarah J.",
    renter: "Michael R.",
    status: "onTrip" as const,
    duration: "Oct 12 - Oct 15",
    value: "$720.00",
    image: "/images/cars/montero-black.jpg",
  },
  {
    car: "Porsche 911 Carrera",
    plate: "GT-1191-BNB",
    owner: "Elena K.",
    renter: "Julian W.",
    status: "pickingUp" as const,
    duration: "Oct 12 - Oct 13",
    value: "$1,150.00",
    image: "/images/cars/fortuner-grey.jpg",
  },
  {
    car: "Tesla Model X",
    plate: "EV-7723-BNB",
    owner: "Robert L.",
    renter: "David S.",
    status: "returning" as const,
    duration: "Oct 09 - Oct 12",
    value: "$480.00",
    image: "/images/cars/city-silver.jpg",
  },
] as const;

const statusBadgeStyles = {
  onTrip: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  pickingUp: "bg-secondary-container text-on-secondary-fixed-variant",
  returning: "bg-error-container text-on-error-container",
};

const statusLabels = {
  onTrip: "On Trip",
  pickingUp: "Picking Up",
  returning: "Returning",
};

export default function DashboardPage() {
  return (
    <>
      <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
        <div className="space-y-12">
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl xl:text-[3.5rem] xl:leading-none">
              Performance Overview
            </h1>
            <p className="mt-3 text-lg font-medium text-on-surface-variant sm:text-xl xl:text-[1.45rem]">
              Real-time pulse of your car-sharing ecosystem.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
            {stats.slice(0, 2).map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="flex min-h-[12.5rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]"
                >
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      {stat.label}
                    </p>
                    <h2 className="mt-4 font-headline text-[3rem] font-extrabold leading-none text-on-surface">
                      {stat.value}
                    </h2>
                  </div>
                  {stat.tone === "positive" ? (
                    <div className="flex items-center gap-2 text-base font-semibold text-on-tertiary-fixed-variant">
                      {Icon ? <Icon className="size-4" /> : null}
                      <span>{stat.footnote}</span>
                    </div>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tertiary-fixed px-4 py-2 text-sm font-semibold text-on-tertiary-fixed-variant">
                      {Icon ? <Icon className="size-4" /> : null}
                      {stat.footnote}
                    </span>
                  )}
                </article>
              );
            })}

            <article className="flex min-h-[12.5rem] flex-col justify-between rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-7 py-6 text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-primary/80">
                    Total Revenue
                  </p>
                  <h2 className="mt-3 font-headline text-[3.45rem] font-extrabold leading-none tracking-tight">
                    $412,930.00
                  </h2>
                </div>
                <div className="grid size-[3.25rem] place-items-center rounded-xl bg-white/16">
                  <Banknote className="size-7" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-on-primary/85">
                <div>
                  <p className="text-sm">Platform Fee (15%)</p>
                  <p className="mt-1 text-[2rem] font-semibold text-on-primary">$61,939</p>
                </div>
                <div className="hidden h-11 w-0.5 rounded-full bg-white/25 sm:block" />
                <div>
                  <p className="text-sm">Payouts</p>
                  <p className="mt-1 text-[2rem] font-semibold text-on-primary">$350,991</p>
                </div>
              </div>
            </article>

            {stats.slice(2).map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="flex min-h-[12.5rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]"
                >
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      {stat.label}
                    </p>
                    <h2 className="mt-4 font-headline text-[3rem] font-extrabold leading-none text-error">
                      {stat.value}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-base font-semibold text-on-error-container">
                    {Icon ? <Icon className="size-4" /> : null}
                    <span>{stat.footnote}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <section className="rounded-xl bg-surface-container p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                  Verification Queue
                </h2>
                <button
                  className="border-none bg-transparent text-sm font-semibold uppercase tracking-wide text-primary"
                  type="button"
                >
                  View All
                </button>
              </div>

              <div className="space-y-5">
                {verificationQueue.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="rounded-xl bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary-container text-on-secondary-fixed-variant">
                          <Icon className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[1.15rem] font-semibold text-on-surface">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-[1.02rem] text-on-surface-variant">
                            {item.description}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              className="rounded-xl border-none bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-95"
                              type="button"
                            >
                              APPROVE
                            </button>
                            <button
                              className="rounded-xl border-none bg-surface-container-highest px-4 py-2 text-sm font-semibold text-surface-tint transition hover:bg-primary-fixed"
                              type="button"
                            >
                              DECLINE
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                    Active Bookings
                  </h2>
                  <p className="text-[1.02rem] text-on-surface-variant">
                    Monitoring currently rented vehicles on the road.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-semibold text-on-surface-variant">
                    TODAY
                  </span>
                  <span className="rounded-full bg-primary-fixed px-4 py-2 text-sm font-semibold text-primary">
                    LIVE MAP
                  </span>
                </div>
              </div>

              <div className="space-y-4 md:hidden">
                {bookings.map((booking) => (
                  <article
                    key={booking.plate}
                    className="rounded-xl bg-surface px-4 py-4 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="overflow-hidden rounded-xl bg-surface-container-high">
                        <Image
                          alt={booking.car}
                          className="h-14 w-20 object-cover"
                          height={56}
                          src={booking.image}
                          width={80}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-on-surface">
                              {booking.car}
                            </h3>
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                              {booking.plate}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              statusBadgeStyles[booking.status]
                            )}
                          >
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-on-surface-variant">
                          {booking.owner} to {booking.renter}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-on-surface-variant">{booking.duration}</span>
                          <span className="font-semibold text-primary">
                            {booking.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden md:block">
                <table className="w-full border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      <th className="pb-3 font-semibold">Vehicle</th>
                      <th className="pb-3 font-semibold">Owner / Renter</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Duration</th>
                      <th className="pb-3 text-right font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking, index) => (
                      <tr
                        key={booking.plate}
                        className={cn(
                          "align-middle transition",
                          index % 2 === 0 ? "bg-surface" : "bg-surface-container-low"
                        )}
                      >
                        <td className="rounded-l-xl py-6 pl-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="overflow-hidden rounded-xl bg-surface-container-high">
                              <Image
                                alt={booking.car}
                                className="h-10 w-[3.75rem] object-cover"
                                height={40}
                                src={booking.image}
                                width={60}
                              />
                            </div>
                            <div>
                              <h3 className="text-[1.05rem] font-semibold text-on-surface">
                                {booking.car}
                              </h3>
                              <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                {booking.plate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 pr-4">
                          <div className="space-y-1">
                            <p className="text-[1.05rem] text-on-surface">
                              {booking.owner}
                            </p>
                            <p className="text-sm text-on-surface-variant">to {booking.renter}</p>
                          </div>
                        </td>
                        <td className="py-6 pr-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              statusBadgeStyles[booking.status]
                            )}
                          >
                            {statusLabels[booking.status]}
                          </span>
                        </td>
                        <td className="py-6 pr-4 text-[1.02rem] text-on-surface">
                          {booking.duration}
                        </td>
                        <td className="rounded-r-xl py-6 pr-4 text-right text-[1.05rem] font-semibold text-primary">
                          {booking.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  className="rounded-full border-none bg-transparent px-4 py-2 text-lg font-semibold tracking-wide text-primary transition hover:bg-surface-container"
                  type="button"
                >
                  LOAD MORE ACTIVITY
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>

      <button
        aria-label="Create new admin item"
        className="fixed bottom-6 right-6 z-50 grid size-16 place-items-center rounded-xl border-none bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] transition hover:scale-[1.03]"
        type="button"
      >
        <Plus className="size-8" />
      </button>
    </>
  );
}
