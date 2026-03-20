import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Edit, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { bookings } from "@/lib/data/mock-data";
import { BookingStatus, PaymentStatus } from "@/types";
import { format, parseISO } from "date-fns";

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

export default function BookingsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <PageHeader
        title="Booking Management"
        description="Monitor active rentals, pending reservations, and payment statuses."
      >
        <Link href="/bookings/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Booking
        </Link>
      </PageHeader>

      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search ref, customer, car..." className="pl-9 bg-background" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Button variant="secondary" size="sm" className="bg-background">All Active</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Pending</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Ongoing</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Completed</Button>
             <div className="w-[1px] h-4 bg-border mx-1 my-auto"></div>
             <Button variant="ghost" size="sm" className="text-muted-foreground">Unpaid</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Booking Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car & Plate</TableHead>
                <TableHead className="hidden xl:table-cell text-center">Cap.</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-muted/30">
                  <TableCell>
                     <span className="font-mono text-xs font-semibold">{booking.referenceNumber}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                     {booking.customerName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/car-listings/${booking.carListingId}`} className="text-sm font-medium hover:underline hover:text-primary transition-colors truncate max-w-[180px]">
                        {booking.carName}
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono mt-0.5">{booking.plateNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-center">
                    <span className="text-xs text-muted-foreground">{booking.seatingCapacity}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                     <Link href={`/owners/${booking.ownerId}`} className="hover:underline hover:text-primary transition-colors">
                        {booking.ownerName}
                     </Link>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col text-xs space-y-0.5">
                       <span className="text-foreground">{format(parseISO(booking.pickupDate), "MMM d, yyyy")}</span>
                       <span className="text-muted-foreground">to {format(parseISO(booking.returnDate), "MMM d, yyyy")}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₱{booking.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getBookingStatusBadge(booking.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted h-8 w-8 outline-none">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem>
                          <Link href={`/bookings/${booking.id}`} className="w-full flex items-center cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit Booking
                        </DropdownMenuItem>
                        {booking.status === BookingStatus.PENDING && (
                          <DropdownMenuItem className="text-indigo-600 focus:text-indigo-600">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
                          </DropdownMenuItem>
                        )}
                         {booking.status === BookingStatus.CONFIRMED && (
                          <DropdownMenuItem className="text-blue-600 focus:text-blue-600">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Start Rental
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Ban className="w-4 h-4 mr-2" /> Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
