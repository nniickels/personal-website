import type { Metadata } from "next";
import "./playground.css";
import { SiteHeader } from "../site-header";
import { SiteFooter } from "../site-footer";
import { NightSky } from "../night-sky";
import { Playground } from "./playground";

const description =
  "Explore interactive astronomy simulations by Nicole Jiang, including black-hole growth, stellar evolution, gravitational lensing, and orbital resonance.";

const socialDescription = "Personal website and portfolio.";

export const metadata: Metadata = {
  title: "Playground — Nicole Jiang",
  description,
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: "/playground",
    siteName: "Nicole Jiang",
    title: "Nicole Jiang",
    description: socialDescription,
    images: [
      {
        url: "/og.png?v=8",
        width: 1200,
        height: 630,
        alt: "Nicole Jiang — astrophysics at U of T",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicole Jiang",
    description: socialDescription,
    images: ["/og.png?v=8"],
  },
};

export default function PlaygroundPage() {
  return <><SiteHeader page="playground" /><NightSky className="night-sky--playground" /><Playground /><SiteFooter /></>;
}
