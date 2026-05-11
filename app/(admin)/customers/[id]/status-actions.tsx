"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldOff, ShieldX, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  verifyCustomerAction,
  rejectCustomerAction,
  suspendCustomerAction,
  flagCustomerForReverificationAction,
  type CustomerActionState,
} from "@/app/actions/customers";
import { CustomerStatus } from "@/types";

// Tier 19 — admin status-transition controls for a single customer.
// Available transitions depend on current status:
//   PENDING   → Verify | Reject | Suspend
//   VERIFIED  → Suspend | Flag for re-verification
//   REJECTED  → Verify (after re-upload) | Suspend
//   SUSPENDED → Verify (re-instate)
export function CustomerStatusActions({
  customerId,
  status,
}: {
  customerId: string;
  status: string;
}) {
  const [verifyState, verifyAction, verifyPending] = useActionState<
    CustomerActionState,
    FormData
  >(verifyCustomerAction, null);
  const [rejectState, rejectAction, rejectPending] = useActionState<
    CustomerActionState,
    FormData
  >(rejectCustomerAction, null);
  const [suspendState, suspendAction, suspendPending] = useActionState<
    CustomerActionState,
    FormData
  >(suspendCustomerAction, null);
  const [flagState, flagAction, flagPending] = useActionState<
    CustomerActionState,
    FormData
  >(flagCustomerForReverificationAction, null);

  const error =
    (verifyState && "error" in verifyState ? verifyState.error : null) ??
    (rejectState && "error" in rejectState ? rejectState.error : null) ??
    (suspendState && "error" in suspendState ? suspendState.error : null) ??
    (flagState && "error" in flagState ? flagState.error : null);

  const canVerify =
    status === CustomerStatus.PENDING ||
    status === CustomerStatus.REJECTED ||
    status === CustomerStatus.SUSPENDED;
  const canReject = status === CustomerStatus.PENDING;
  const canSuspend =
    status === CustomerStatus.PENDING ||
    status === CustomerStatus.VERIFIED ||
    status === CustomerStatus.REJECTED;
  const canFlag = status === CustomerStatus.VERIFIED;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {canVerify ? (
          <form action={verifyAction}>
            <input name="customerId" type="hidden" value={customerId} />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={verifyPending}
              type="submit"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {verifyPending
                ? "Verifying..."
                : status === CustomerStatus.SUSPENDED
                  ? "Reinstate"
                  : "Verify"}
            </Button>
          </form>
        ) : null}
        {canReject ? (
          <form action={rejectAction}>
            <input name="customerId" type="hidden" value={customerId} />
            <Button disabled={rejectPending} type="submit" variant="outline">
              <ShieldX className="w-4 h-4 mr-2" />
              {rejectPending ? "Rejecting..." : "Reject"}
            </Button>
          </form>
        ) : null}
        {canSuspend ? (
          <form action={suspendAction}>
            <input name="customerId" type="hidden" value={customerId} />
            <Button disabled={suspendPending} type="submit" variant="outline">
              <ShieldOff className="w-4 h-4 mr-2" />
              {suspendPending ? "Suspending..." : "Suspend"}
            </Button>
          </form>
        ) : null}
        {canFlag ? (
          <form action={flagAction}>
            <input name="customerId" type="hidden" value={customerId} />
            <Button disabled={flagPending} type="submit" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {flagPending ? "Flagging..." : "Re-verify"}
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
