"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelBookingAction, type BookingActionState } from "@/app/actions/bookings";

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    cancelBookingAction,
    null,
  );

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
      <h3 className="text-sm font-semibold text-red-800">Cancel this booking</h3>
      <p className="mt-1 text-xs text-red-800/80">
        You can cancel while the booking is still pending. Once admin confirms, cancellation
        has to go through them.
      </p>
      {state?.error ? (
        <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-800">{state.error}</div>
      ) : null}
      <form action={formAction} className="mt-3">
        <input name="bookingId" type="hidden" value={bookingId} />
        <Button disabled={pending} type="submit" variant="destructive">
          {pending ? "Cancelling..." : "Cancel booking"}
        </Button>
      </form>
    </div>
  );
}
