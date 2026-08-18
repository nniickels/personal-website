import type { Metadata } from "next";
import { ThemeToggle } from "../theme-toggle";

export const metadata: Metadata = {
  title: "Résumé / CV — Nicole Jiang",
  description: "Nicole Jiang's résumé and curriculum vitae.",
  openGraph: {
    title: "Résumé / CV — Nicole Jiang",
    description: "Nicole Jiang's résumé and curriculum vitae.",
    images: [],
  },
  twitter: {
    title: "Résumé / CV — Nicole Jiang",
    description: "Nicole Jiang's résumé and curriculum vitae.",
    images: [],
  },
};

export default function ResumePage() {
  return (
    <>
      <header className="bar topbar">
        <div className="container bar-content">
          <a href="/" aria-label="Nicole Jiang home">nj</a>
          <div className="topbar-actions">
            <ThemeToggle />
            <a href="/">Home</a>
          </div>
        </div>
      </header>

      <main className="container layout">
        <section className="hero document">
          <h1>Résumé / CV</h1>
          <p>Content coming soon.</p>
        </section>
      </main>

      <footer className="bar bottombar">
        <div className="container bar-content">
          <p>© {new Date().getFullYear()} Nicole Jiang</p>
        </div>
      </footer>
    </>
  );
}
