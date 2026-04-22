"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createOwnerAction, type OwnerActionState } from "@/app/actions/owners";

export default function NewOwnerPage() {
  const [statusKey, setStatusKey] = useState<"pending" | "verified">("pending");
  const [state, formAction, pending] = useActionState<OwnerActionState, FormData>(
    createOwnerAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/owners"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Owners
        </Link>
      </div>

      <PageHeader
        description="Register a new car owner manually into the platform."
        title="Add New Owner"
      />

      <form action={formAction} className="space-y-8">
        {/* Hidden input lets us keep the Radix Select UI while still submitting
            its value as plain form data. */}
        <input name="statusKey" type="hidden" value={statusKey} />

        {state?.error ? (
          <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Basic contact and profile details of the owner.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Juan Dela Cruz"
                required
              />
              {fieldError("fullName") ? (
                <p className="text-xs text-red-600">{fieldError("fullName")}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                placeholder="+63 9XX XXX XXXX"
                required
              />
              {fieldError("contactNumber") ? (
                <p className="text-xs text-red-600">{fieldError("contactNumber")}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                placeholder="owner@example.com"
                required
                type="email"
              />
              {fieldError("email") ? (
                <p className="text-xs text-red-600">{fieldError("email")}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input
                id="password"
                minLength={8}
                name="password"
                placeholder="Min 8 characters — share with the owner out-of-band"
                required
                type="text"
              />
              {fieldError("password") ? (
                <p className="text-xs text-red-600">{fieldError("password")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Temp password for first login. Owner can change it after they sign in.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                onValueChange={(v) => setStatusKey(v as "pending" | "verified")}
                value={statusKey}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                className="resize-none"
                id="address"
                name="address"
                placeholder="Complete residential address"
                required
              />
              {fieldError("address") ? (
                <p className="text-xs text-red-600">{fieldError("address")}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Payout & Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>
              Where should the platform send the owner&apos;s earnings payout?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank / E-Wallet</Label>
              <Input
                id="bankDetails"
                name="bankDetails"
                placeholder="e.g. BDO · 1234567890 · Juan Dela Cruz"
              />
              <p className="text-xs text-muted-foreground">
                Include bank/e-wallet name, account number, and account holder name
                in one line. Detailed payout schema will be added later.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents — UI present but wiring lands in Tier 2.5 */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
            <CardDescription>
              Document upload will be enabled later in Tier 2.5 (Supabase Storage
              wiring pending).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Valid Government ID</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload coming in Tier 2.5</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SVG, PNG, JPG or PDF (max. 5MB)
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Driver&apos;s License (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload coming in Tier 2.5</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SVG, PNG, JPG or PDF (max. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="remarks">Internal Remarks</Label>
              <Textarea
                className="resize-none h-24"
                id="remarks"
                name="remarks"
                placeholder="Any internal notes about this owner (only visible to admins)"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
            <Link className={buttonVariants({ variant: "outline" })} href="/owners">
              Cancel
            </Link>
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save Owner Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
