import type { Metadata } from "next";
import { Portfolio } from "../portfolio";

const description = "Nicole Jiang's interests, collections, music, media, and games.";

export const metadata: Metadata = {
  title: "Side Quests — Nicole Jiang",
  description,
  alternates: { canonical: "/side-quests" },
  openGraph: {
    type: "website",
    url: "/side-quests",
    siteName: "Nicole Jiang",
    title: "Side Quests — Nicole Jiang",
    description,
    images: [
      {
        url: "/og.png?v=7",
        width: 1200,
        height: 630,
        alt: "Nicole Jiang — astronomy and physics undergraduate at U of T",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Side Quests — Nicole Jiang",
    description,
    images: ["/og.png?v=7"],
  },
};

export default function SideQuestsPage() {
  return <Portfolio mode="fun" />;
}
