import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy | DriveXP",
  description:
    "How DriveXP collects, uses, and protects the personal data of hosts and customers on the marketplace.",
};

const LAST_UPDATED = "2026-05-08";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <Image
              alt="DriveXP"
              className="h-8 w-auto"
              height={32}
              priority
              src="/driveXP-logo-wordmark.png"
              width={129}
            />
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Last updated {LAST_UPDATED}
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Draft — pre-launch version.</p>
          <p className="mt-1 text-xs">
            This document is a pre-launch draft. The final version will be
            reviewed by legal counsel before DriveXP accepts real bookings.
            If you spot an inaccuracy, contact{" "}
            <a className="underline" href="mailto:support@drivexp.com">
              support@drivexp.com
            </a>
            .
          </p>
        </div>

        <article className="prose-content space-y-8 text-on-surface">
          <Section title="1. Who we are">
            <p>
              DriveXP (&quot;DriveXP&quot;, &quot;we&quot;, &quot;us&quot;) is
              a peer-to-peer car rental marketplace operating in the
              Philippines. We connect independent car owners and registered
              car rental operators (&quot;hosts&quot;) with people who want to
              rent a car (&quot;customers&quot;).
            </p>
            <p>
              This Privacy Policy explains what personal information we
              collect from hosts and customers, how we use that information,
              and the choices you have. It is governed by the Philippines{" "}
              <em>Data Privacy Act of 2012 (Republic Act No. 10173)</em>{" "}
              and its implementing rules and regulations.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>
              We collect the following information directly from you when you
              sign up and use DriveXP:
            </p>

            <SubHeading>Account information</SubHeading>
            <List
              items={[
                "Full name",
                "Email address",
                "Password (hashed by our authentication provider — never stored in plaintext)",
                "If you sign in with Google: your Google profile name and profile picture, plus the email associated with your Google account",
              ]}
            />

            <SubHeading>Profile + contact information</SubHeading>
            <List
              items={[
                "Contact number",
                "Mailing or pickup address",
                "Profile bio (hosts only; visible on your public host profile once verified)",
                "For fleet operators: company name, business registration number, and service area",
              ]}
            />

            <SubHeading>Identity verification documents</SubHeading>
            <List
              items={[
                "A scan or photo of a government-issued ID (both hosts and customers)",
                "A scan or photo of your driver's license (customers and individual hosts)",
                "A scan or photo of your business registration certificate, such as a DTI or SEC certificate (fleet operators only)",
              ]}
            />
            <p>
              Verification documents are stored in a private encrypted bucket
              with our infrastructure provider (Supabase). They are accessible
              only via short-lived signed links generated server-side, and
              only by you, our admin verification team, and (in the case of a
              confirmed booking) the host you are renting from so they can
              confirm your identity at handover.
            </p>

            <SubHeading>Booking and transaction information</SubHeading>
            <List
              items={[
                "Listings you view, favorite, and inquire about",
                "Bookings you create, including pickup and return dates, prices, and payment status (we record whether cash was paid at pickup; we do not store credit-card or banking credentials)",
                "Messages you exchange with the other party in a booking (one chat thread per booking)",
                "Reviews you leave after a completed trip",
              ]}
            />

            <SubHeading>Technical information</SubHeading>
            <List
              items={[
                "Authentication session cookies issued by our authentication provider (Supabase) to keep you signed in",
                "Server-side logs of requests you make to DriveXP for security and debugging (IP address, user agent, request path, timestamp)",
              ]}
            />
            <p>
              DriveXP does not currently use third-party advertising trackers,
              analytics cookies, or social-media share pixels.
            </p>
          </Section>

          <Section title="3. How we use your information">
            <p>We use the information we collect to:</p>
            <List
              items={[
                "Create and manage your account",
                "Verify your identity before allowing you to book or list a car on the marketplace",
                "Match hosts with customers, facilitate bookings, and let hosts and customers communicate about an active booking",
                "Display your public host profile (hosts only, after admin verification) so customers can browse cars and decide who to rent from",
                "Calculate platform commissions and payouts",
                "Respond to questions, complaints, and disputes you raise with our admin team",
                "Detect and prevent fraud, abuse, and misuse of the platform",
                "Comply with legal obligations under Philippine law",
              ]}
            />
          </Section>

          <Section title="4. Who we share your information with">
            <p>
              We share information only as needed to operate the marketplace:
            </p>

            <SubHeading>The other party in a booking</SubHeading>
            <p>
              When a booking is confirmed, the host can see the customer&apos;s
              name, contact number, and verification documents (so they can
              confirm identity at pickup); the customer can see the host&apos;s
              name, public profile, and contact number. We do not share your
              identity documents with anyone outside this need-to-know scope.
            </p>

            <SubHeading>Our admin team</SubHeading>
            <p>
              DriveXP staff with administrator privileges can access your
              account and verification documents to approve verifications,
              review disputes, manage suspended accounts, and provide
              support.
            </p>

            <SubHeading>Service providers</SubHeading>
            <List
              items={[
                "Supabase — hosts our authentication, database, and file-storage infrastructure",
                "Vercel — hosts the DriveXP application servers and serves the website",
                "Google — for users who choose to sign in via Google, Google receives the authentication request and returns your email and basic profile information to us",
              ]}
            />
            <p>
              These providers process your information solely on our behalf
              and are bound by their own data-protection commitments. They do
              not have rights to use your data for their own purposes.
            </p>

            <SubHeading>Legal disclosures</SubHeading>
            <p>
              We may disclose your information to law enforcement or
              regulatory authorities if required by Philippine law, a valid
              subpoena, or a comparable legal process. We will notify you when
              permitted to do so.
            </p>

            <p className="font-semibold">
              We do not sell your personal information.
            </p>
          </Section>

          <Section title="5. How long we keep your information">
            <p>
              We keep your account information and verification documents for
              as long as your account is active. If you delete your account,
              we will delete your verification documents within 30 days,
              except where we are required to retain certain records under
              Philippine tax or business law (typically a 10-year retention
              period for transaction records).
            </p>
            <p>
              Booking and review history may be retained longer in aggregate
              or anonymized form for marketplace integrity (so that a
              customer&apos;s past trip with a host is preserved in the
              host&apos;s aggregate rating, for example).
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>
              Under the Philippines Data Privacy Act, you have the right to:
            </p>
            <List
              items={[
                "Be informed about how we process your personal data",
                "Access the personal data we hold about you",
                "Object to or restrict the processing of your data",
                "Correct inaccurate or outdated information",
                "Request that we delete data we no longer need",
                "Receive a copy of your data in a portable format",
                "Withdraw consent for processing that depends on your consent",
                "File a complaint with the National Privacy Commission",
              ]}
            />
            <p>
              To exercise any of these rights, email{" "}
              <a className="underline" href="mailto:support@drivexp.com">
                support@drivexp.com
              </a>
              . We will respond within a reasonable time (and within any
              applicable statutory deadlines).
            </p>
          </Section>

          <Section title="7. Cookies and session storage">
            <p>
              DriveXP uses a small number of strictly-necessary cookies and
              browser-storage entries to keep you signed in and to remember
              your in-session preferences. These cookies are set by our
              authentication provider (Supabase) and are essential for the
              site to function. We do not use marketing or third-party
              tracking cookies.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We protect your data using industry-standard practices:
              encrypted connections (HTTPS) between your browser and our
              servers, encryption at rest for stored documents, server-side
              authorization checks on every request, role-based access
              controls in our admin tooling, and least-privilege access for
              our staff. No system is perfectly secure; if you believe your
              account has been compromised, contact us immediately.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              DriveXP is not intended for users under the age of 18. To rent
              or list a vehicle, you must be at least 18 years old and hold a
              valid Philippine driver&apos;s license (customers, individual
              hosts). We do not knowingly collect personal information from
              minors. If you believe a minor has signed up, contact us and we
              will delete the account.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. If we make
              a material change, we will notify registered users by email and
              update the &quot;Last updated&quot; date at the top of this
              page. Continued use of DriveXP after a change means you accept
              the updated policy.
            </p>
          </Section>

          <Section title="11. Relationship to our Terms of Service">
            <p>
              This Privacy Policy forms part of our{" "}
              <Link className="underline" href="/terms">
                Terms of Service
              </Link>
              . Capitalized terms not defined here have the meanings given to
              them in the Terms of Service.
            </p>
          </Section>

          <Section title="12. Contact us">
            <p>
              For questions about this Privacy Policy or about how we handle
              your personal data, email{" "}
              <a className="underline" href="mailto:support@drivexp.com">
                support@drivexp.com
              </a>
              .
            </p>
          </Section>
        </article>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-on-surface-variant">
          <p>© 2026 DriveXP Marketplace.</p>
          <div className="flex gap-4">
            <Link className="hover:text-primary" href="/terms">
              Terms of Service
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
