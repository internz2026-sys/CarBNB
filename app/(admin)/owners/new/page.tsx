"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewOwnerPage() {
  const router = useRouter();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save and redirect
    router.push("/owners");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/owners" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Owners
        </Link>
      </div>

      <PageHeader
        title="Add New Owner"
        description="Register a new car owner manually into the platform."
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic contact and profile details of the owner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="e.g. Juan Dela Cruz" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input id="contactNumber" placeholder="+63 9XX XXX XXXX" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="owner@example.com" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select defaultValue="pending">
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea id="address" placeholder="Complete residential address" className="resize-none" />
            </div>
          </CardContent>
        </Card>

        {/* Payout & Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>Where should the platform send the owner's earnings payout?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank / E-Wallet Name</Label>
              <Input id="bankDetails" placeholder="e.g. BDO, BPI, GCash" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" placeholder="Account number or mobile number" />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
            <CardDescription>Upload necessary identification.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
             <div className="space-y-3">
              <Label>Valid Government ID</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Driver's License (Optional)</Label>
               <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
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
              <Textarea id="remarks" placeholder="Any internal notes about this owner (only visible to admins)" className="resize-none h-24" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
             <Link href="/owners" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
             <Button type="submit">Save Owner Profile</Button>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
}
