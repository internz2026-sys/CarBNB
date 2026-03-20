import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, User, CheckCircle2, AlertTriangle, MessageSquare, Ban, Check, Car, UserCircle, MapPin, Receipt, Clock, Wallet } from "lucide-react";
import Link from "next/link";
import { bookings, carListings, owners, customers } from "@/lib/data/mock-data";
import { BookingStatus, PaymentStatus } from "@/types";
import { format, parseISO, differenceInDays } from "date-fns";
import Image from "next/image";

function getBookingStatusBadge(status: BookingStatus) {
  switch (status) {
    case BookingStatus.COMPLETED:
      return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20">{status}</Badge>;
    case BookingStatus.ONGOING:
      return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/20">{status}</Badge>;
    case BookingStatus.CONFIRMED:
      return <Badge className="bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 border-indigo-500/20">{status}</Badge>;
    case BookingStatus.PENDING:
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20">{status}</Badge>;
    case BookingStatus.CANCELLED:
    case BookingStatus.REJECTED:
      return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentStatusBadge(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">{status}</Badge>;
    case PaymentStatus.UNPAID:
      return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">{status}</Badge>;
    case PaymentStatus.PARTIALLY_PAID:
      return <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">{status}</Badge>;
    case PaymentStatus.REFUNDED:
      return <Badge variant="outline" className="text-gray-600 border-gray-600 bg-gray-50">{status}</Badge>;
    default:
       return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = bookings.find(b => b.id === params.id) || bookings[0];
  const car = carListings.find(c => c.id === booking.carListingId)!;
  const owner = owners.find(o => o.id === booking.ownerId)!;
  const customer = customers.find(c => c.id === booking.customerId)!;

  const pickup = parseISO(booking.pickupDate);
  const dropoff = parseISO(booking.returnDate);
  const rentalDays = differenceInDays(dropoff, pickup) || 1; // Minimum 1 day

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/bookings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bookings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="font-mono text-muted-foreground uppercase text-2xl">#{booking.referenceNumber}</span>
            </h1>
            {getBookingStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>
          <p className="text-muted-foreground text-sm">
            Created on {format(new Date(booking.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          {booking.status === BookingStatus.PENDING && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
               <CheckCircle2 className="w-4 h-4 mr-2" />
               Confirm Booking
            </Button>
          )}
          {booking.status === BookingStatus.CONFIRMED && (
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
               <Car className="w-4 h-4 mr-2" />
               Start Rental (Pickup)
            </Button>
          )}
           {booking.status === BookingStatus.ONGOING && (
             <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
               <Check className="w-4 h-4 mr-2" />
               Complete Rental (Return)
            </Button>
          )}
          <Button variant="outline" className="shadow-sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: People & Car Summary */}
        <div className="md:col-span-1 space-y-6">
           {/* Customer Card */}
           <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                Customer Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {customer.fullName.charAt(0)}
                 </div>
                 <div>
                    <span className="font-semibold block">{customer.fullName}</span>
                    <Badge variant="outline" className="text-[10px] font-normal leading-none px-1.5 py-0.5 border-emerald-200 bg-emerald-50 text-emerald-700 mt-1">Verified License</Badge>
                 </div>
              </div>
              <div className="space-y-2 text-sm pt-2 border-t border-border/50">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Mobile:</span>
                   <span className="font-medium">{customer.contactNumber}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Email:</span>
                   <span className="font-medium truncate max-w-[140px]" title={customer.email}>{customer.email}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Trips:</span>
                   <span className="font-medium">3 previous</span>
                 </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs h-8">View Customer Profile</Button>
            </CardContent>
          </Card>

          {/* Owner Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Owner Info</span>
              </CardTitle>
            </CardHeader>
             <CardContent className="pt-4 text-sm space-y-3">
                <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {owner.fullName.charAt(0)}
                 </div>
                 <Link href={`/owners/${owner.id}`} className="font-semibold hover:underline text-primary transition-colors">
                    {owner.fullName}
                 </Link>
              </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Mobile:</span>
                 <span className="font-medium">{owner.contactNumber}</span>
               </div>
                <div className="flex justify-between">
                 <span className="text-muted-foreground">Location:</span>
                 <span className="font-medium truncate max-w-[140px]">{owner.address}</span>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Schedule & Payment */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Trip Details */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/10 border-b border-border py-4">
                <CardTitle className="text-base font-semibold">Rental Itinerary</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               {/* Car Strip */}
                <div className="flex gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors group">
                   <div className="w-24 aspect-video relative bg-muted rounded overflow-hidden border border-border">
                      <Image src={car.photos[0]} alt={car.model} fill className="object-cover" />
                   </div>
                   <div className="flex-1 flex justify-between items-center">
                      <div>
                        <Link href={`/car-listings/${car.id}`} className="font-bold text-lg hover:underline group-hover:text-primary transition-colors leading-tight block mb-1">
                          {car.brand} {car.model} {car.year}
                        </Link>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs shadow-sm bg-background">{car.plateNumber}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" /> {car.transmission}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-sm text-muted-foreground block mb-1">Daily Rate</span>
                         <span className="font-bold text-emerald-600">₱{car.dailyPrice.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                {/* Schedule Box */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-4 relative">
                   <div className="hidden sm:block absolute left-1/2 top-10 bottom-10 w-px bg-border -translate-x-1/2"></div>
                   
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                         <MapPin className="w-4 h-4" /> Pick-up
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                         <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium text-lg">{format(pickup, "EEE, MMM d, yyyy")}</span>
                         </div>
                         <div className="flex items-center gap-3 pl-8">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">10:00 AM (Default)</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                         <MapPin className="w-4 h-4" /> Drop-off
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                         <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium text-lg">{format(dropoff, "EEE, MMM d, yyyy")}</span>
                         </div>
                          <div className="flex items-center gap-3 pl-8">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">10:00 AM (Default)</span>
                         </div>
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-border/50 shadow-sm">
             <CardHeader className="bg-muted/10 border-b border-border py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Payment Details
                </CardTitle>
                <div className="flex items-center gap-2 text-sm bg-background px-3 py-1 rounded-full border border-border">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Credit Card</span>
                </div>
             </CardHeader>
             <CardContent className="pt-6">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Rental Rate (₱{car.dailyPrice} x {rentalDays} days)</span>
                      <span className="font-medium">₱{(car.dailyPrice * rentalDays).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">Security Deposit <Badge variant="secondary" className="text-[9px] h-4">Refundable</Badge></span>
                      <span className="font-medium">₱5,000</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Platform Service Fee (Included in Total)</span>
                      <span className="font-medium">₱{(booking.totalAmount * 0.15).toLocaleString()}</span>
                   </div>
                   <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Amount</span>
                      <span className="font-bold text-2xl tracking-tight text-foreground">₱{booking.totalAmount.toLocaleString()}</span>
                   </div>
                </div>

                {/* Additional Payment Info if applicable */}
                {booking.paymentStatus === PaymentStatus.UNPAID && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Payment Pending</h4>
                      <p className="text-xs text-red-600/80 mt-1">Customer has not yet completed payment. Do not hand over the vehicle until payment is verified.</p>
                      <Button size="sm" variant="outline" className="mt-3 bg-white border-red-200 text-red-700 hover:bg-red-50">Record Manual Payment</Button>
                    </div>
                  </div>
                )}
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
