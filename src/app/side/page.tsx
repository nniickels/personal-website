import type { Metadata } from "next";
import { Portfolio } from "../portfolio";

const description =
  "Explore Nicole Jiang's photography, music, collections, favourite places, games, reading, and watching through interactive galleries and live listening statistics.";

const socialDescription = "Personal website and portfolio.";

export const metadata: Metadata = {
  title: "Side — Nicole Jiang",
  description,
  alternates: { canonical: "/side" },
  openGraph: {
    type: "website",
    url: "/side",
    siteName: "Nicole Jiang",
    title: "Nicole Jiang - Personal Website",
    description: socialDescription,
    images: [
      {
        url: "/og.png?v=9",
        width: 1200,
        height: 630,
        alt: "Edge-on black hole with a glowing accretion disc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicole Jiang - Personal Website",
    description: socialDescription,
    images: ["/og.png?v=9"],
  },
};

export default function SidePage() {
  return <Portfolio mode="fun" />;
}
