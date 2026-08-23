import type { Metadata } from "next";
import { Portfolio } from "../portfolio";

const description = "Nicole Jiang's interests, collections, music, media, and games.";

export const metadata: Metadata = {
  title: "Side Quests — Nicole Jiang",
  description,
  alternates: { canonical: "/side-quests" },
};

export default function SideQuestsPage() {
  return <Portfolio mode="fun" />;
}
