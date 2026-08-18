import type { Metadata } from "next";
import { DocumentPage } from "../document-page";

export const metadata: Metadata = {
  title: "CV — Nicole Jiang",
  description: "Nicole Jiang's curriculum vitae.",
  openGraph: {
    title: "CV — Nicole Jiang",
    description: "Nicole Jiang's curriculum vitae.",
    images: [],
  },
  twitter: {
    title: "CV — Nicole Jiang",
    description: "Nicole Jiang's curriculum vitae.",
    images: [],
  },
};

export default function CvPage() {
  return (
    <DocumentPage
      label="Curriculum vitae"
      title="CV"
      description="A complete record of academic and professional experience."
    />
  );
}
