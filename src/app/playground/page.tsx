import type { Metadata } from "next";
import { Playground } from "./playground";

const description =
  "Explore interactive astronomy simulations by Nicole Jiang, including black-hole growth, stellar evolution, gravitational lensing, and orbital resonance.";

export const metadata: Metadata = {
  title: "Playground — Nicole Jiang",
  description,
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <Playground />;
}
