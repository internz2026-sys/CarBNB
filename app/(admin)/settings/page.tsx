import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <PageHeader
        title="Platform Settings"
        description="Configure rules, fees, and system-wide preferences."
      />
      
      <div className="grid gap-6">
        <Card>
           <CardHeader>
              <CardTitle>Financial & Fees</CardTitle>
              <CardDescription>Configure core marketplace rates.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4">
                 <div>
                    <Label className="font-semibold text-foreground">Platform Commission Rate</Label>
                    <p className="text-sm text-muted-foreground">Percentage taken from every booking</p>
                 </div>
                 <div className="relative">
                    <Input type="number" defaultValue={15} className="pl-3 pr-8 w-24 ml-auto" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                 </div>
              </div>
               <div className="grid grid-cols-2 items-center gap-4 pt-4 border-t border-border">
                 <div>
                    <Label className="font-semibold text-foreground">Standard Security Deposit</Label>
                    <p className="text-sm text-muted-foreground">Default amount held for incidentals</p>
                 </div>
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input type="number" defaultValue={5000} className="pl-8 w-32 ml-auto" />
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card>
           <CardHeader>
              <CardTitle>Booking Rules</CardTitle>
              <CardDescription>Rules that universally apply to all fleet vehicles.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                    <Label className="font-semibold text-foreground">Auto-Approve Verify Customers</Label>
                    <p className="text-sm text-muted-foreground">Instantly confirm bookings for customers with verified IDs.</p>
                 </div>
                 <Switch defaultChecked />
              </div>
               <div className="flex items-center justify-between">
                 <div>
                    <Label className="font-semibold text-foreground">Require Owner Confirmation</Label>
                    <p className="text-sm text-muted-foreground">Owners must manually accept each booking request.</p>
                 </div>
                 <Switch />
              </div>
               <div className="flex items-center justify-between">
                 <div>
                    <Label className="font-semibold text-foreground">Minimum Booking Notice</Label>
                    <p className="text-sm text-muted-foreground">How many hours in advance needed.</p>
                 </div>
                 <div className="relative">
                    <Input type="number" defaultValue={24} className="pl-3 pr-10 w-24 ml-auto" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">hrs</span>
                 </div>
              </div>
           </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
           <Button variant="outline">Reset to Defaults</Button>
           <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
