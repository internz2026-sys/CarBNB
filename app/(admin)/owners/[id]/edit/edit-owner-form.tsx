"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateOwnerAction, type OwnerActionState } from "@/app/actions/owners";

export type EditableOwner = {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  address: string;
  bankDetails: string | null;
  remarks: string | null;
};

export function EditOwnerForm({ owner }: { owner: EditableOwner }) {
  const [state, formAction, pending] = useActionState<OwnerActionState, FormData>(
    updateOwnerAction,
    null,
  );
  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <input name="ownerId" type="hidden" value={owner.id} />

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Contact and profile details. Email is read-only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              defaultValue={owner.fullName}
              id="fullName"
              name="fullName"
              required
            />
            {fieldError("fullName") ? (
              <p className="text-xs text-red-600">{fieldError("fullName")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              defaultValue={owner.contactNumber}
              id="contactNumber"
              name="contactNumber"
              required
            />
            {fieldError("contactNumber") ? (
              <p className="text-xs text-red-600">{fieldError("contactNumber")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (read-only)</Label>
            <Input
              defaultValue={owner.email}
              disabled
              id="email"
              readOnly
              type="email"
            />
            <p className="text-xs text-muted-foreground">
              Changing email would desync from Supabase Auth for self-signed-up
              hosts. Contact support to change.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              className="resize-none"
              defaultValue={owner.address}
              id="address"
              name="address"
              required
            />
            {fieldError("address") ? (
              <p className="text-xs text-red-600">{fieldError("address")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Details</CardTitle>
          <CardDescription>Payout destination for this owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bankDetails">Bank / E-Wallet</Label>
            <Input
              defaultValue={owner.bankDetails ?? ""}
              id="bankDetails"
              name="bankDetails"
              placeholder="e.g. BDO · 1234567890 · Juan Dela Cruz"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="remarks">Internal Remarks</Label>
            <Textarea
              className="resize-none h-24"
              defaultValue={owner.remarks ?? ""}
              id="remarks"
              name="remarks"
              placeholder="Any internal notes about this owner (only visible to admins)"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owners/${owner.id}`}
          >
            Cancel
          </Link>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
