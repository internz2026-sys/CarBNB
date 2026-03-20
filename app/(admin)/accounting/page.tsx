import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, FileText, ArrowUpRight, ArrowDownRight, Wallet, Percent, DollarSign } from "lucide-react";
import { accountingEntries } from "@/lib/data/mock-data";
import { TransactionType, PayoutStatus } from "@/types";
import { format, parseISO } from "date-fns";

export default function AccountingPage() {
  const totalRevenue = accountingEntries.reduce((sum, entry) => sum + entry.platformFee, 0);
  const totalPayouts = accountingEntries.reduce((sum, entry) => sum + entry.ownerPayout, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <PageHeader
        title="Accounting & Payouts"
        description="Track platform revenue, owner commissions, and payout history."
      >
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Ledger (CSV)
        </Button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-800">Total Platform Revenue</CardTitle>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">₱{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600/80 font-medium flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Owner Payouts</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Funds disbursed to fleet owners</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱24,500</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Needs attention • 3 queue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <Percent className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground mt-1">Standard platform fee applied</p>
          </CardContent>
        </Card>
      </div>

       <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden mt-6">
         <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
            <h3 className="font-semibold text-lg">Master Ledger</h3>
            <div className="relative w-full sm:max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input placeholder="Search ref or owner..." className="pl-9 bg-background h-9" />
            </div>
         </div>

         <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date / Ref</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer Payment</TableHead>
                <TableHead>Platform Fee (15%)</TableHead>
                <TableHead>Owner Payout (85%)</TableHead>
                <TableHead>Payout Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="font-medium text-sm text-foreground">{format(parseISO(entry.date), "MMM d, yyyy")}</span>
                       <span className="text-xs text-muted-foreground font-mono mt-0.5">{entry.bookingId.split("-")[0].toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.type === TransactionType.COMMISSION ? (
                       <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Booking Comm.</Badge>
                    ) : (
                       <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Refund/Other</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₱{entry.bookingAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600 border-l border-border bg-emerald-50/10">
                     + ₱{entry.platformFee.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-blue-700">
                    ₱{entry.ownerPayout.toLocaleString()}
                  </TableCell>
                  <TableCell>
                     {entry.payoutStatus === "Released" ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Sent to Bank</Badge>
                     ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-normal">Pending Transfer</Badge>
                     )}
                  </TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" className="h-8 shadow-none border border-border">
                        <FileText className="w-3.5 h-3.5 mr-2" /> Receipt
                     </Button>
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
