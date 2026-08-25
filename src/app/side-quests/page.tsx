import type { Metadata } from "next";
import { Portfolio } from "../portfolio";

const description =
  "Explore Nicole Jiang's photography, music, reading, games, collections, and food through interactive galleries and live listening statistics.";

export const metadata: Metadata = {
  title: "Side Quests — Nicole Jiang",
  description,
  alternates: { canonical: "/side-quests" },
};

export default function SideQuestsPage() {
  return <Portfolio mode="fun" />;
}
