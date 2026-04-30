import type { Metadata } from "next";
import LandingPage from "@/components/marketing/landing-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DriveXP | Premium Peer-to-Peer Car Sharing",
  description:
    "Discover verified cars, trusted hosts, and curated road trips with DriveXP.",
};

export default function HomePage() {
  return <LandingPage />;
}
