import type { Metadata } from "next";
import { Playground } from "./playground";

const description = "Interactive astronomy experiments and simulations by Nicole Jiang.";

export const metadata: Metadata = {
  title: "Playground — Nicole Jiang",
  description,
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <Playground />;
}
