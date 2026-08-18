import type { Metadata } from "next";
import { DocumentPage } from "../document-page";

export const metadata: Metadata = {
  title: "Résumé — Nicole Jiang",
  description: "Nicole Jiang's résumé.",
  openGraph: {
    title: "Résumé — Nicole Jiang",
    description: "Nicole Jiang's résumé.",
    images: [],
  },
  twitter: {
    title: "Résumé — Nicole Jiang",
    description: "Nicole Jiang's résumé.",
    images: [],
  },
};

export default function ResumePage() {
  return (
    <DocumentPage
      label="Professional summary"
      title="Résumé"
      description="A concise overview of experience, skills, and selected work."
    />
  );
}
