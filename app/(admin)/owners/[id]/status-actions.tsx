"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  approveOwnerAction,
  suspendOwnerAction,
  type OwnerActionState,
} from "@/app/actions/owners";
import { OwnerStatus } from "@/types";

// Small client island that owns the approve/suspend buttons + error banner
// for a single owner on the detail page. The surrounding page stays a
// server component so it keeps doing its own Prisma fetch.
export function OwnerStatusActions({
  ownerId,
  status,
}: {
  ownerId: string;
  status: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState<
    OwnerActionState,
    FormData
  >(approveOwnerAction, null);
  const [suspendState, suspendAction, suspendPending] = useActionState<
    OwnerActionState,
    FormData
  >(suspendOwnerAction, null);

  const error = approveState?.error ?? suspendState?.error;

  const canApprove =
    status === OwnerStatus.PENDING ||
    status === OwnerStatus.SUSPENDED ||
    status === OwnerStatus.REJECTED;
  const canSuspend =
    status === OwnerStatus.VERIFIED || status === OwnerStatus.PENDING;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {canApprove ? (
          <form action={approveAction}>
            <input name="ownerId" type="hidden" value={ownerId} />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={approvePending}
              type="submit"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {approvePending
                ? "Approving..."
                : status === OwnerStatus.SUSPENDED
                  ? "Reactivate Owner"
                  : "Approve Owner"}
            </Button>
          </form>
        ) : null}
        {canSuspend ? (
          <form action={suspendAction}>
            <input name="ownerId" type="hidden" value={ownerId} />
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
