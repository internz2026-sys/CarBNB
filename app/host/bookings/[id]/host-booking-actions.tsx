"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { BookingStatus } from "@/types";
import {
  hostConfirmBookingAction,
  hostRejectBookingAction,
  type HostBookingActionState,
} from "@/app/actions/host-bookings";
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons";

export function HostBookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [confirmState, confirmAction, confirmPending] = useActionState<
    HostBookingActionState,
    FormData
  >(hostConfirmBookingAction, null);

  // Hosts only act on PENDING bookings — admin owns the rest of the
  // lifecycle. If the booking has moved past PENDING we render nothing.
  if (status !== BookingStatus.PENDING) return null;

  return (
    <div className="rounded-xl bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-on-surface">Respond to this request</p>
        <p className="text-xs text-on-surface-variant">
          Accept to confirm the reservation, or reject with a reason. Once you confirm, the
          admin handles pickup, return, and payment.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action={confirmAction}>
          <input name="bookingId" type="hidden" value={bookingId} />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={confirmPending}
            type="submit"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {confirmPending ? "Confirming..." : "Accept Booking"}
          </Button>
        </form>

        <RejectDialog bookingId={bookingId} />
      </div>

      {confirmState?.error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {confirmState.error}
        </div>
      ) : null}
    </div>
  );
}

function RejectDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(CANCELLATION_REASONS[0].slug);
  const [state, formAction, pending] = useActionState<HostBookingActionState, FormData>(
    hostRejectBookingAction,
    null,
  );
  const isOther = reason === "other";

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        className="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-destructive hover:bg-red-50"
        type="button"
      >
        <XCircle className="w-4 h-4 mr-2" />
        Reject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this booking?</DialogTitle>
          <DialogDescription>
            Pick a reason so the customer knows why. If none fit, choose <em>Other</em> and
            describe it.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="bookingId" type="hidden" value={bookingId} />
          <input name="reason" type="hidden" value={reason} />

          {state?.error ? (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{state.error}</div>
          ) : null}

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select onValueChange={(v) => v && setReason(v)} value={reason}>
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {CANCELLATION_REASONS.find((r) => r.slug === reason)?.label ?? "Select reason"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reject-note">
              Note{" "}
              {isOther ? (
                <span className="text-red-600">(required)</span>
              ) : (
                <span className="text-muted-foreground">(optional)</span>
              )}
            </Label>
            <Textarea
              className="resize-none h-20"
              id="reject-note"
              maxLength={500}
              name="note"
              placeholder={isOther ? "Describe the reason" : "Add context (optional)"}
              required={isOther}
            />
            {state?.fieldErrors?.note?.[0] ? (
              <p className="text-xs text-red-600">{state.fieldErrors.note[0]}</p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Back</DialogClose>
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? "Rejecting..." : "Reject Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
