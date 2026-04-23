"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DayOfWeek } from "@/types";
import {
  saveHostAvailabilityRulesAction,
  type HostListingActionState,
} from "@/app/actions/host-listings";

const DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

type RuleRow = {
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
};

export function HostAvailabilityRulesForm({
  listingId,
  rules,
}: {
  listingId: string;
  rules: RuleRow[];
}) {
  const [state, formAction, pending] = useActionState<HostListingActionState, FormData>(
    saveHostAvailabilityRulesAction,
    null,
  );

  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Toggle each day this car is rentable and set its daily window. Customers will
            only see dates that match this schedule (plus any exceptions below).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input name="listingId" type="hidden" value={listingId} />

          {state?.error ? (
            <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="hidden sm:grid grid-cols-[8rem_auto_1fr_1fr] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2">
              <span>Day</span>
              <span className="text-center">Available</span>
              <span>Start</span>
              <span>End</span>
            </div>
            {DAYS.map((day) => (
              <DayRow existing={byDay.get(day) ?? null} key={day} day={day} />
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end rounded-b-xl border-dashed">
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save Schedule"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function DayRow({ day, existing }: { day: DayOfWeek; existing: RuleRow | null }) {
  const isAvailable = existing?.isAvailable ?? false;
  const startTime = existing?.startTime ?? "08:00";
  const endTime = existing?.endTime ?? "18:00";

  return (
    <div className="grid grid-cols-[5rem_auto_1fr_1fr] sm:grid-cols-[8rem_auto_1fr_1fr] gap-3 items-center px-2 py-2 rounded-md hover:bg-muted/30">
      <Label className="text-sm font-medium">{day}</Label>
      <div className="flex items-center justify-center">
        <Switch defaultChecked={isAvailable} name={`rule-${day}-available`} value="on" />
      </div>
      <Input defaultValue={startTime} name={`rule-${day}-start`} type="time" />
      <Input defaultValue={endTime} name={`rule-${day}-end`} type="time" />
    </div>
  );
}
