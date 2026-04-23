"use client";

import { useActionState, useState } from "react";
import { Ban, CheckCircle2, Play, Receipt, StopCircle, XCircle } from "lucide-react";

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
import { BookingStatus, PaymentStatus } from "@/types";
import {
  cancelBookingAdminAction,
  completeRentalAction,
  confirmBookingAction,
  markBookingPaidAction,
  rejectBookingAction,
  startRentalAction,
  type AdminBookingActionState,
} from "@/app/actions/admin-bookings";
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons";

export function BookingActions({
  bookingId,
  paymentStatus,
  status,
}: {
  bookingId: string;
  paymentStatus: string;
  status: string;
}) {
  const [confirmState, confirmAction, confirmPending] = useActionState<
    AdminBookingActionState,
    FormData
  >(confirmBookingAction, null);
  const [startState, startAction, startPending] = useActionState<
    AdminBookingActionState,
    FormData
  >(startRentalAction, null);
  const [completeState, completeAction, completePending] = useActionState<
    AdminBookingActionState,
    FormData
  >(completeRentalAction, null);

  const error =
    confirmState?.error ?? startState?.error ?? completeState?.error;

  const canConfirm = status === BookingStatus.PENDING;
  const canReject = status === BookingStatus.PENDING;
  const canStart = status === BookingStatus.CONFIRMED;
  const canComplete = status === BookingStatus.ONGOING;
  const canCancel =
    status === BookingStatus.PENDING ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.ONGOING;
  const canMarkPaid =
    paymentStatus === PaymentStatus.UNPAID &&
    (status === BookingStatus.CONFIRMED ||
      status === BookingStatus.ONGOING ||
      status === BookingStatus.COMPLETED);

  // Nothing actionable? Don't render the bar at all.
  if (!canConfirm && !canStart && !canComplete && !canCancel && !canReject && !canMarkPaid) {
    return null;
  }

  return (
    <div className="rounded-xl bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {canConfirm ? (
          <form action={confirmAction}>
            <input name="bookingId" type="hidden" value={bookingId} />
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={confirmPending}
              type="submit"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {confirmPending ? "Confirming..." : "Confirm Booking"}
            </Button>
          </form>
        ) : null}

        {canStart ? (
          <form action={startAction}>
            <input name="bookingId" type="hidden" value={bookingId} />
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={startPending}
              type="submit"
            >
              <Play className="w-4 h-4 mr-2" />
              {startPending ? "Starting..." : "Start Rental"}
            </Button>
          </form>
        ) : null}

        {canComplete ? (
          <form action={completeAction}>
            <input name="bookingId" type="hidden" value={bookingId} />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={completePending}
              type="submit"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {completePending ? "Completing..." : "Complete Rental"}
            </Button>
          </form>
        ) : null}

        {canMarkPaid ? <MarkPaidDialog bookingId={bookingId} /> : null}

        {canReject ? (
          <CancelOrRejectDialog
            bookingId={bookingId}
            kind="reject"
            triggerClassName="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
            triggerLabel={
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </>
            }
          />
        ) : null}

        {canCancel ? (
          <CancelOrRejectDialog
            bookingId={bookingId}
            kind="cancel"
            triggerClassName="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-destructive hover:bg-red-50"
            triggerLabel={
              <>
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </>
            }
          />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      ) : null}
    </div>
  );
}

function MarkPaidDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    AdminBookingActionState,
    FormData
  >(markBookingPaidAction, null);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
        type="button"
      >
        <Receipt className="w-4 h-4 mr-2" />
        Mark as Paid
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record cash payment</DialogTitle>
          <DialogDescription>
            Marks this booking as paid. Payment method defaults to <strong>CASH</strong>;
            timestamp and your email are recorded automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="bookingId" type="hidden" value={bookingId} />

          {state?.error ? (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              className="resize-none h-20"
              id="notes"
              maxLength={500}
              name="notes"
              placeholder="e.g. Paid at pickup, partial payment, etc."
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={pending} type="submit">
              {pending ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CancelOrRejectDialog({
  bookingId,
  kind,
  triggerClassName,
  triggerLabel,
}: {
  bookingId: string;
  kind: "cancel" | "reject";
  triggerClassName: string;
  triggerLabel: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(CANCELLATION_REASONS[0].slug);
  const action = kind === "cancel" ? cancelBookingAdminAction : rejectBookingAction;
  const [state, formAction, pending] = useActionState<
    AdminBookingActionState,
    FormData
  >(action, null);
  const isOther = reason === "other";
  const verb = kind === "cancel" ? "Cancel" : "Reject";

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className={triggerClassName} type="button">
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{verb} this booking?</DialogTitle>
          <DialogDescription>
            Pick a reason so we have it on record. If none of the preset reasons fit,
            choose <em>Other</em> and describe it.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="bookingId" type="hidden" value={bookingId} />
          <input name="reason" type="hidden" value={reason} />

          {state?.error ? (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
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
            <Label htmlFor="cancel-note">
              Note {isOther ? <span className="text-red-600">(required)</span> : <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              className="resize-none h-20"
              id="cancel-note"
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
            <DialogClose render={<Button type="button" variant="outline" />}>
              Back
            </DialogClose>
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? `${verb.slice(0, -1)}ing...` : `${verb} Booking`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
