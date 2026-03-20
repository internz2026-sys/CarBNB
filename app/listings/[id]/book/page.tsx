import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Plus, CheckCircle2, MessageCircle } from "lucide-react";

export default async function BookingConfirmation() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const mockRole = user?.user_metadata?.role;
  const fullName = user?.user_metadata?.fullName || (mockRole === "customer" ? "Jamie Cruz" : "Alex Rivera");

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface pb-24 font-sans antialiased">
      {/* Top Navigation Bar */}
      <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-white/70 px-6 shadow-sm backdrop-blur-md">
        <Link href="/#" className="scale-95 text-on-surface-variant transition-all active:scale-100">
          <ArrowLeft className="size-6" />
        </Link>
        <span className="font-headline text-xl font-black text-primary">carBNB</span>
        <div className="flex items-center gap-4">
          <button className="scale-95 text-on-surface-variant transition-all active:scale-100" type="button">
            <MessageCircle className="size-6 text-on-surface-variant fill-on-surface-variant/20" />
          </button>
          {mockRole ? (
            <UserProfileDropdown
              name={fullName}
              role={mockRole === "customer" ? "Customer" : "Host Account"}
              imageUrl={mockRole === "customer"
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"}
              onLogoutHref="/login"
            />
          ) : (
            <div className="flex items-center gap-4 pl-4 border-l border-outline-variant/30">
              <Link href="/login" className="text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="mx-auto mt-20 max-w-lg space-y-6 px-4">
        {/* Header & Status Section */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Confirm Booking</h1>
            <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-secondary-fixed-variant">Pending</span>
          </div>
          <p className="text-sm leading-relaxed text-on-surface-variant">Review your luxury selection before confirming your reservation with the host.</p>
        </section>

        {/* Vehicle Summary Card */}
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest">
          <div className="relative h-56 w-full">
            <Image
              alt="Modern dark gray luxury sedan side profile"
              className="object-cover"
              fill
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe-KZhPVKNCqZrmf8SdmHkNZTSOEYZ0T5PrbVuWbffjl-fUcCkHie5eAVuEiYih9BW5hyGaclSbP5P2p2vtTCHnIRcSEoFklU_C4tS8lhxJRBkJOivkBawkM_YwITmdLRBPMBW13312E_KxXsQ3SMAS14q76WX3ea40yytix8M4bPFgH1gt8llc71b-TBizfl_pWjXhH28fKvw1lBIucr6CKXpLrhZ7YtisHjhOVbewVs2AHwKSnjF-LZ9OUJJgRjIm-1ZUT-Fuok"
            />
            <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
              <p className="font-headline text-[10px] font-bold uppercase tracking-widest text-primary">Verified Elite</p>
              <h2 className="font-headline text-lg font-bold text-on-surface">Porsche Taycan Turbo S</h2>
            </div>
          </div>
          
          <div className="space-y-4 p-6">
            <div className="flex items-start space-x-4">
              <div className="rounded-xl bg-surface-container-high p-3">
                <CalendarDays className="size-6 text-primary" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Pickup</p>
                  <p className="text-sm font-bold">Oct 12, 10:00 AM</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Return</p>
                  <p className="text-sm font-bold">Oct 15, 06:00 PM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="rounded-xl bg-surface-container-high p-3">
                <MapPin className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Location</p>
                <p className="text-sm font-bold">Beverly Hills High-End Hub</p>
                <p className="text-xs text-on-surface-variant">90210 Los Angeles, CA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <section className="space-y-4 rounded-xl bg-surface-container p-6">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Cost Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Rental Fee ($245 x 3 days)</span>
              <span className="text-sm font-semibold text-on-surface">$735.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Platform Service Fee</span>
              <span className="text-sm font-semibold text-on-surface">$42.50</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Insurance (Premium)</span>
              <span className="text-sm font-semibold text-tertiary-container">Included</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-4">
              <span className="text-base font-bold text-on-surface">Total Amount</span>
              <span className="text-xl font-extrabold text-primary">$777.50</span>
            </div>
          </div>
        </section>

        {/* Payment Selection */}
        <section className="space-y-4">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Payment Method</h3>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-surface-container-lowest p-4 ring-2 ring-inset ring-primary">
              <div className="flex items-center space-x-4">
                <div className="flex h-6 w-10 items-center justify-center rounded bg-slate-900">
                  <span className="text-[8px] font-bold text-white">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-bold">•••• 4242</p>
                  <p className="text-[10px] text-on-surface-variant">Expires 12/26</p>
                </div>
              </div>
              <CheckCircle2 className="size-6 fill-primary text-white" />
            </label>
            <button className="flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-outline-variant bg-transparent p-4 text-sm font-semibold text-primary transition-all hover:bg-surface-container" type="button">
              <Plus className="size-4" />
              <span>Add New Method</span>
            </button>
          </div>
        </section>

        {/* CTA Action */}
        <div className="pb-8 pt-4">
          <Link href="/dashboard" className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-lg font-bold text-white shadow-xl shadow-primary/20 transition-transform hover:opacity-90 active:scale-95">
            Confirm Booking
          </Link>
          <p className="mt-4 px-8 text-center text-[10px] leading-relaxed text-on-surface-variant">
            By tapping confirm, you agree to our <span className="text-primary underline">Terms of Service</span> and authorize the temporary hold of the total amount.
          </p>
        </div>
      </main>

    </div>
  );
}
