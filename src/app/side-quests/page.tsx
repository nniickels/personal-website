import type { Metadata } from "next";
import { Portfolio } from "../portfolio";

const description =
  "Explore Nicole Jiang's photography, music, reading, games, collections, and food through interactive galleries and live listening statistics.";

export const metadata: Metadata = {
  title: "Side Quests — Nicole Jiang",
  description,
  alternates: { canonical: "/side-quests" },
  openGraph: {
    type: "website",
    url: "/side-quests",
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

export default function SideQuestsPage() {
  return <Portfolio mode="fun" />;
}
