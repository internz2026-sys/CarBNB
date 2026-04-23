"use client";

import { useActionState, useState } from "react";
import { format, parseISO } from "date-fns";
import { Ban, CalendarPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
  addAvailabilityExceptionAction,
  deleteAvailabilityExceptionAction,
  type ListingActionState,
} from "@/app/actions/listings";

const STATUS_OPTIONS = [
  { value: "no", label: "Block this date" },
  { value: "yes", label: "Force available (override)" },
] as const;

type ExceptionRow = {
  id: string;
  date: string;
  isAvailable: boolean;
  reason: string | null;
};

export function AvailabilityExceptionsForm({
  listingId,
  exceptions,
}: {
  listingId: string;
  exceptions: ExceptionRow[];
}) {
  const [isAvailable, setIsAvailable] = useState<"no" | "yes">("no");
  const [addState, addAction, addPending] = useActionState<ListingActionState, FormData>(
    addAvailabilityExceptionAction,
    null,
  );
  const [deleteState, deleteAction] = useActionState<ListingActionState, FormData>(
    deleteAvailabilityExceptionAction,
    null,
  );

  const error = addState?.error ?? deleteState?.error;
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-Specific Exceptions</CardTitle>
        <CardDescription>
          Override the weekly schedule on individual dates. Use this to block holidays or
          open up a normally-closed day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <form action={addAction} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
          <input name="listingId" type="hidden" value={listingId} />
          <input name="isAvailable" type="hidden" value={isAvailable} />
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="exception-date">
              Date
            </Label>
            <Input
              defaultValue={today}
              id="exception-date"
              min={today}
              name="date"
              required
              type="date"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select onValueChange={(v) => v && setIsAvailable(v as "no" | "yes")} value={isAvailable}>
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {STATUS_OPTIONS.find((o) => o.value === isAvailable)?.label ?? "Select status"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="exception-reason">
              Reason (optional)
            </Label>
            <Input
              id="exception-reason"
              maxLength={200}
              name="reason"
              placeholder="e.g. Owner traveling, maintenance, holiday"
            />
          </div>
          <Button className="gap-2" disabled={addPending} type="submit">
            <CalendarPlus className="size-4" />
            {addPending ? "Adding..." : "Add"}
          </Button>
        </form>

        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No exceptions configured.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {exceptions.map((ex) => (
              <li className="flex items-center justify-between gap-3 p-3" key={ex.id}>
                <div className="flex items-start gap-3">
                  <Ban
                    className={`size-4 mt-0.5 ${ex.isAvailable ? "text-emerald-600" : "text-red-500"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {format(parseISO(ex.date), "MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.isAvailable ? "Forced available" : "Blocked"}
                      {ex.reason ? ` · ${ex.reason}` : ""}
                    </p>
                  </div>
                </div>
                <form action={deleteAction}>
                  <input name="exceptionId" type="hidden" value={ex.id} />
                  <Button
                    aria-label="Remove exception"
                    className="text-destructive hover:text-destructive"
                    size="icon"
                    type="submit"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
