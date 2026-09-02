import type { Metadata } from "next";
import { Playground } from "./playground";

const description =
  "Explore interactive astronomy simulations by Nicole Jiang, including black-hole growth, stellar evolution, gravitational lensing, and orbital resonance.";

export const metadata: Metadata = {
  title: "Playground — Nicole Jiang",
  description,
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: "/playground",
    siteName: "Nicole Jiang",
    title: "Nicole Jiang",
    description,
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
    description,
    images: ["/og.png?v=8"],
  },
};

export default function PlaygroundPage() {
  return <Playground />;
}
