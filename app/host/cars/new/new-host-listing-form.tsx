"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
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
  createHostListingAction,
  type HostListingActionState,
} from "@/app/actions/host-listings";

export function NewHostListingForm() {
  const [transmission, setTransmission] = useState<string>("Automatic");
  const [fuelType, setFuelType] = useState<string>("Gasoline");
  const [state, formAction, pending] = useActionState<HostListingActionState, FormData>(
    createHostListingAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <input name="transmission" type="hidden" value={transmission} />
      <input name="fuelType" type="hidden" value={fuelType} />

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input
              className="font-mono uppercase tracking-wider"
              id="plateNumber"
              name="plateNumber"
              placeholder="ABC 1234"
              required
            />
            {fieldError("plateNumber") ? (
              <p className="text-xs text-red-600">{fieldError("plateNumber")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year Model</Label>
            <Input
              id="year"
              max={2030}
              min={1980}
              name="year"
              placeholder="e.g. 2024"
              required
              type="number"
            />
            {fieldError("year") ? (
              <p className="text-xs text-red-600">{fieldError("year")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" placeholder="e.g. Toyota" required />
            {fieldError("brand") ? (
              <p className="text-xs text-red-600">{fieldError("brand")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" placeholder="e.g. Vios" required />
            {fieldError("model") ? (
              <p className="text-xs text-red-600">{fieldError("model")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" placeholder="e.g. Pearl White" required />
            {fieldError("color") ? (
              <p className="text-xs text-red-600">{fieldError("color")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">City Location</Label>
            <Input id="location" name="location" placeholder="e.g. Makati City" required />
            {fieldError("location") ? (
              <p className="text-xs text-red-600">{fieldError("location")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Transmission</Label>
            <Select onValueChange={(v) => v && setTransmission(v)} value={transmission}>
              <SelectTrigger>
                <span className="truncate text-left">{transmission}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select onValueChange={(v) => v && setFuelType(v)} value={fuelType}>
              <SelectTrigger>
                <span className="truncate text-left">{fuelType}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasoline">Gasoline</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input
              id="seatingCapacity"
              max={15}
              min={2}
              name="seatingCapacity"
              placeholder="e.g. 5"
              required
              type="number"
            />
            {fieldError("seatingCapacity") ? (
              <p className="text-xs text-red-600">{fieldError("seatingCapacity")}</p>
            ) : null}
          </div>

          <div className="md:col-span-3 border-t border-border" />

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="dailyPrice">Daily Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₱
              </span>
              <Input
                className="pl-8 font-medium text-lg"
                id="dailyPrice"
                min={1}
                name="dailyPrice"
                placeholder="e.g. 2500"
                required
                step="1"
                type="number"
              />
            </div>
            {fieldError("dailyPrice") ? (
              <p className="text-xs text-red-600">{fieldError("dailyPrice")}</p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description for Renters</Label>
            <Textarea
              className="resize-none h-24"
              id="description"
              name="description"
              placeholder="Describe the vehicle's features, condition, and any rental rules..."
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-between gap-3 rounded-b-xl border-dashed">
          <p className="text-sm text-muted-foreground max-w-sm">
            After saving you&apos;ll land on the edit page to upload photos, OR/CR, and set
            availability. Listing goes live once admin approves it.
          </p>
          <div className="flex gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="/host/cars">
              Cancel
            </Link>
            <Button disabled={pending} type="submit">
              {pending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
