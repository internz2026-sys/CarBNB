import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service | DriveXP",
  description:
    "The terms governing your use of the DriveXP peer-to-peer car rental marketplace.",
};

const LAST_UPDATED = "2026-05-25";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <BrandLogo />
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-on-surface-variant",
            )}
            href="/"
          >
            <ArrowLeft className="mr-1 size-4" />
            Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Last updated {LAST_UPDATED}
          </p>
        </div>

        <article className="prose-content space-y-8 text-on-surface">
          <Section title="1. About DriveXP">
            <p>
              DriveXP (&quot;DriveXP&quot;, &quot;we&quot;, &quot;us&quot;) is
              a peer-to-peer car rental marketplace operating in the
              Philippines. We connect independent car owners and registered
              car rental operators (&quot;hosts&quot;) with people who want to
              rent a car (&quot;customers&quot;).
            </p>
            <p>
              DriveXP is a <strong>platform</strong>, not a party to the
              rental itself. Each rental is a contract between the host and
              the customer. We facilitate discovery, identity verification,
              booking, communication, and payment recording, but we do not
              own the vehicles, drive them, or operate them.
            </p>
            <p>
              By creating an account or using DriveXP, you agree to these
              Terms of Service (&quot;Terms&quot;). If you do not agree,
              please do not use DriveXP.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>To use DriveXP, you must:</p>
            <List
              items={[
                "Be at least 18 years old",
                "Hold a valid Philippine government-issued ID",
                "If renting (customer): hold a valid Philippine driver's license",
                "If hosting (individual): hold a valid Philippine driver's license and own (or have a legal right to rent out) the vehicle you list",
                "If hosting (fleet operator): be a registered business in the Philippines with a current DTI, SEC, or comparable registration",
                "Provide accurate, current, and complete information when you sign up and when you submit verification documents",
              ]}
            />
            <p>
              DriveXP may decline to verify any account at our discretion,
              including (but not limited to) accounts with unclear documents,
              suspected fraud, or a previous rejection.
            </p>
          </Section>

          <Section title="3. Account and verification">
            <p>
              You are responsible for keeping your account credentials
              private and for all activity on your account. Notify us
              immediately if you believe your account has been compromised.
            </p>
            <p>
              Before you can list a car (hosts) or book a car (customers),
              your account must be approved by our admin team. Verification
              requires uploading the documents listed in our{" "}
              <Link className="underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              We may suspend or terminate any account at any time, with or
              without notice, if we have reason to believe the account is
              being used in violation of these Terms, applicable law, or in
              a way that endangers other users or vehicles.
            </p>
          </Section>

          <Section title="4. Booking and rental terms">
            <SubHeading>Daily-rate, inclusive billing</SubHeading>
            <p>
              Pricing on DriveXP is per day, with both the pickup day and the
              return day counted in the total. A rental from January 1 to
              January 3 is billed as 3 days. The total price the customer
              sees at the time of booking is the price they pay (subject to
              applicable refunds described in Section 7).
            </p>

            <SubHeading>Pickup and return</SubHeading>
            <p>
              Customers and hosts arrange the time and location of pickup and
              return directly through the in-platform chat for each booking.
              Both parties must inspect the vehicle at pickup and at return,
              ideally with photos. Hosts are responsible for confirming the
              customer&apos;s ID matches the verification documents on file
              before handing over the keys.
            </p>

            <SubHeading>Behavior during the rental</SubHeading>
            <p>
              Customers agree to operate the vehicle lawfully and
              responsibly, including obeying Philippine traffic and parking
              laws, not driving under the influence, not using the vehicle
              for illegal activity, and not letting unauthorized drivers
              operate the vehicle. Hosts agree to provide a vehicle that is
              roadworthy, registered, and insured.
            </p>
          </Section>

          <Section title="5. Payment">
            <p>
              All payments on DriveXP are currently <strong>cash on
              pickup</strong>, paid by the customer to the host (or, for
              fleet-managed cars, to the fleet operator) directly. DriveXP
              does not process credit cards or hold customer funds.
            </p>
            <p>
              When a booking is marked as paid by the admin, DriveXP records
              the transaction and the applicable platform commission.
              Commission rates are set in the Platform Settings and are
              locked in at the time the booking is created (changing the
              commission later does not retroactively change prior bookings).
            </p>
            <p>
              Hosts are responsible for their own tax obligations on the
              income they earn through DriveXP, including BIR registration,
              VAT or percentage tax (where applicable), and annual income
              tax filings.
            </p>
          </Section>

          <Section title="6. Cancellations">
            <SubHeading>Customer-initiated</SubHeading>
            <p>
              Customers may cancel a pending or confirmed booking through
              their account. Once a booking is ongoing (i.e., the rental
              has started), it cannot be cancelled — only ended early at the
              host&apos;s discretion. Refund eligibility for cash-paid
              bookings is determined case-by-case by DriveXP admin in
              consultation with the host.
            </p>

            <SubHeading>Host-initiated</SubHeading>
            <p>
              Hosts may reject a pending booking with a reason. Once the
              booking is confirmed, hosts cannot cancel unilaterally; any
              cancellation requires admin intervention. Hosts who repeatedly
              cancel confirmed bookings may be suspended.
            </p>

            <SubHeading>Admin-initiated</SubHeading>
            <p>
              DriveXP admin may cancel any booking if a fraud signal is
              detected, if either party loses verified status, or for other
              marketplace-integrity reasons. We will notify both parties.
            </p>
          </Section>

          <Section title="7. Damage, loss, and liability">
            <p>
              DriveXP is a marketplace, not an insurer. Hosts and customers
              acknowledge that the platform does not own, operate, or
              insure the vehicles. Each rental is a private contract between
              the host and the customer.
            </p>
            <p>
              <strong>
                You agree that DriveXP is not liable for any damage to
                vehicles, personal injury, traffic violations, lost or
                stolen items, vehicle theft, or any other loss arising from
                the use, possession, or operation of a vehicle rented
                through the platform.
              </strong>
            </p>
            <p>
              Disputes about damage, fuel level, mileage, or condition at
              return must be raised within 48 hours of the return and are
              resolved between the host and the customer. DriveXP admin may
              mediate informally but has no obligation to enforce any
              particular outcome.
            </p>
            <p>
              Hosts are strongly encouraged to maintain comprehensive vehicle
              insurance covering third-party use. Customers are encouraged to
              confirm their own driver&apos;s insurance coverage before
              renting.
            </p>
          </Section>

          <Section title="8. Acceptable use">
            <p>You agree NOT to:</p>
            <List
              items={[
                "Impersonate another person or submit forged or altered verification documents",
                "Use DriveXP to evade taxes, launder money, or facilitate any illegal activity",
                "Harass, threaten, or discriminate against another user",
                "Scrape, mirror, or attempt to copy listings or user data for use outside DriveXP",
                "Attempt to circumvent the booking flow to avoid platform commissions (e.g., taking an introduction off-platform and then completing the rental privately)",
                "Reverse engineer, decompile, or attempt to extract source code from DriveXP",
                "Use bots, scripts, or any automated means to interact with the platform",
              ]}
            />
            <p>
              Violation of these rules may result in suspension or
              termination of your account and, where appropriate, referral
              to law enforcement.
            </p>
          </Section>

          <Section title="9. Reviews">
            <p>
              After a completed rental, the customer may leave one review of
              the listing and host. Reviews must be honest and based on the
              customer&apos;s direct experience. DriveXP reserves the right
              to remove reviews that contain personal attacks, prohibited
              content, or appear to be fraudulent (e.g., a review for a
              booking that never happened).
            </p>
          </Section>

          <Section title="10. Intellectual property">
            <p>
              The DriveXP name, logo, and all platform code, designs, and
              copy are owned by DriveXP. You may not reproduce them without
              permission. Photos and bios that hosts upload remain owned by
              the host; by uploading, you grant DriveXP a non-exclusive
              license to display them on the marketplace.
            </p>
          </Section>

          <Section title="11. Suspension and termination">
            <p>
              DriveXP may suspend or terminate your account at any time for
              breach of these Terms, abuse of the platform, fraud, or other
              behavior that endangers users. You may close your account at
              any time by emailing{" "}
              <a className="underline" href="mailto:accounts@zillamedia.co">
                accounts@zillamedia.co
              </a>
              . Closing your account does not erase records of past
              bookings; see our{" "}
              <Link className="underline" href="/privacy">
                Privacy Policy
              </Link>{" "}
              for retention details.
            </p>
          </Section>

          <Section title="12. Changes to these Terms">
            <p>
              We may update these Terms from time to time. If we make a
              material change, we will notify registered users by email and
              update the &quot;Last updated&quot; date above. Continued use
              of DriveXP after a change means you accept the updated Terms.
            </p>
          </Section>

          <Section title="13. Governing law and disputes">
            <p>
              These Terms are governed by the laws of the Republic of the
              Philippines, without regard to conflict-of-laws principles.
              Any dispute that cannot be resolved by good-faith negotiation
              between the parties shall be referred to the competent courts
              of Metro Manila.
            </p>
          </Section>

          <Section title="14. Contact us">
            <p>
              For questions about these Terms, email{" "}
              <a className="underline" href="mailto:accounts@zillamedia.co">
                accounts@zillamedia.co
              </a>
              .
            </p>
          </Section>
        </article>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-on-surface-variant">
          <p>© 2026 DriveXP Marketplace.</p>
          <div className="flex gap-4">
            <Link className="hover:text-primary" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-primary" href="/">
              Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
        {title}
      </h2>
      <div className="space-y-3 text-base leading-7 text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-on-surface">
      {children}
    </h3>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
