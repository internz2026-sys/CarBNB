"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UploadCloud, Search, Calendar as CalendarIcon, Car, Calculator } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { carListings, customers } from "@/lib/data/mock-data";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function NewBookingPage() {
  const router = useRouter();
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedCarId, setSelectedCarId] = useState<string>("");

  const selectedCar = carListings.find(c => c.id === selectedCarId);
  const days = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
  const estimatedTotal = selectedCar && days > 0 ? (selectedCar.dailyPrice * days) + 5000 : 0; // + 5000 deposit

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/bookings");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/bookings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bookings
        </Link>
      </div>

      <PageHeader
        title="Create Admin Booking"
        description="Manually override or create a reservation on behalf of a customer."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Customer & Car Selection */}
        <div className="grid md:grid-cols-2 gap-6">
           <Card className="border-border shadow-sm">
             <CardHeader className="pb-4">
               <CardTitle className="text-base">Customer</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Existing Customer</Label>
                  <Select defaultValue={customers[0].id}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Search customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.fullName} ({c.contactNumber})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or add new</span></div>
                </div>
                <Button variant="outline" className="w-full" type="button">Quick Add Customer</Button>
             </CardContent>
           </Card>

           <Card className="border-border shadow-sm">
             <CardHeader className="pb-4">
               <CardTitle className="text-base">Vehicle</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Available Car</Label>
                  <Select onValueChange={(val) => setSelectedCarId(val as string)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Search by model or plate" />
                    </SelectTrigger>
                    <SelectContent>
                      {carListings.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.brand} {c.model} - {c.plateNumber} (₱{c.dailyPrice}/d)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCar && (
                  <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20 flex gap-3">
                     <div className="w-16 h-12 relative rounded overflow-hidden shrink-0 border border-border">
                        <Image src={selectedCar.photos[0]} alt={selectedCar.model} fill className="object-cover" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold leading-tight">{selectedCar.brand} {selectedCar.model}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedCar.plateNumber} • ₱{selectedCar.dailyPrice}/day</p>
                     </div>
                  </div>
                )}
             </CardContent>
           </Card>
        </div>

        {/* Schedule */}
        <Card className="border-border shadow-sm">
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <CalendarIcon className="w-4 h-4" /> Rental Schedule
             </CardTitle>
           </CardHeader>
           <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2 flex flex-col items-center sm:items-start">
                 <Label className="mb-2 block">Select Date Range</Label>
                 <Calendar
                    mode="range"
                    // @ts-ignore - shadcn calendar typing quirk with range mode
                    selected={date}
                    // @ts-ignore
                    onSelect={setDate}
                    className="rounded-md border shadow-sm w-fit bg-background"
                    numberOfMonths={1}
                 />
              </div>

              <div className="space-y-6 flex flex-col justify-center">
                 <div className="space-y-2">
                    <Label>Pickup Timing</Label>
                    <Select defaultValue="10:00">
                      <SelectTrigger>
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="14:00">02:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Return Timing</Label>
                    <Select defaultValue="10:00">
                      <SelectTrigger>
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="14:00">02:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="border-border shadow-sm bg-muted/10">
           <CardHeader className="pb-3 border-b border-border">
             <CardTitle className="text-base flex items-center gap-2">
               <Calculator className="w-4 h-4 text-emerald-600" /> Estimated Cost Breakdown
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-4">
              {!selectedCarId || !date?.from || !date?.to ? (
                <div className="text-center py-6 text-sm text-muted-foreground italic">
                   Select a vehicle and valid date range to see the pricing breakdown.
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-3 text-sm">
                   <div className="flex justify-between text-muted-foreground">
                      <span>Rental ({selectedCar?.dailyPrice || 0} x {days} days)</span>
                      <span>₱{((selectedCar?.dailyPrice || 0) * days).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-muted-foreground">
                      <span>Security Deposit (Refundable)</span>
                      <span>₱5,000</span>
                   </div>
                   <div className="pt-3 border-t border-border flex justify-between font-bold text-lg text-foreground mt-3">
                      <span>Total Due</span>
                      <span className="text-emerald-600">₱{estimatedTotal.toLocaleString()}</span>
                   </div>
                   
                   <div className="pt-4 space-y-2">
                     <Label>Initial Payment Method</Label>
                     <Select defaultValue="GCash Transfer">
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash Deposit at Office">Cash Deposit at Office</SelectItem>
                          <SelectItem value="GCash Transfer">GCash Transfer</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Card via Stripe (Hold)">Card via Stripe (Hold)</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
              )}
           </CardContent>
           <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-between rounded-b-xl border-dashed">
             <Link href="/bookings" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
             <Button type="submit" disabled={!selectedCarId || !date?.from || !date?.to} className="bg-indigo-600 hover:bg-indigo-700">
               Confirm & Reserve
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
