"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  approveListingAction,
  suspendListingAction,
  type ListingActionState,
} from "@/app/actions/listings";
import { ListingStatus } from "@/types";

export function ListingStatusActions({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState<
    ListingActionState,
    FormData
  >(approveListingAction, null);
  const [suspendState, suspendAction, suspendPending] = useActionState<
    ListingActionState,
    FormData
  >(suspendListingAction, null);

  const error = approveState?.error ?? suspendState?.error;

  const canApprove =
    status === ListingStatus.PENDING_APPROVAL ||
    status === ListingStatus.SUSPENDED ||
    status === ListingStatus.REJECTED;
  const canSuspend =
    status === ListingStatus.ACTIVE ||
    status === ListingStatus.PENDING_APPROVAL ||
    status === ListingStatus.BOOKED;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {canApprove ? (
          <form action={approveAction}>
            <input name="listingId" type="hidden" value={listingId} />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={approvePending}
              type="submit"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {approvePending
                ? "Approving..."
                : status === ListingStatus.SUSPENDED
                  ? "Reactivate Listing"
                  : "Approve Listing"}
            </Button>
          </form>
        ) : null}
        {canSuspend ? (
          <form action={suspendAction}>
            <input name="listingId" type="hidden" value={listingId} />
            <Button disabled={suspendPending} type="submit" variant="outline">
              <ShieldOff className="w-4 h-4 mr-2" />
              {suspendPending ? "Suspending..." : "Suspend"}
            </Button>
          </form>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
