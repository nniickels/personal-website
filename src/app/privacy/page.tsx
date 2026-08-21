import type { Metadata } from "next";
import { ThemeToggle } from "../theme-toggle";

export const metadata: Metadata = {
  title: "Privacy | Nicole Jiang",
  description: "Privacy information for nicolejiang.com.",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="bar topbar">
        <div className="container topbar-content">
          <a className="text-btn home-link" href="/" aria-label="Nicole Jiang home">
            同同
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="container privacy-page">
        <h1>Privacy</h1>
        <p>Last updated: Aug 21, 2026</p>

        <section>
          <h2>Information this site uses</h2>
          <p>
            This portfolio does not ask visitors to create an account or submit personal
            information. Your light or dark theme and Main Quest or Side Quests preference may be
            stored locally in your browser. Standard technical request information may be
            processed by the site&apos;s hosting provider for security and reliability.
          </p>
        </section>

        <section>
          <h2>Connected services</h2>
          <p>
            The site may display selected statistics from Nicole&apos;s Pinterest, Spotify, Clash
            Royale, and Steam accounts. These connections run on the server and do not give
            visitors access to account credentials. Links to third-party websites are governed by
            those services&apos; own privacy policies.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions, email{" "}
            <a className="text-link" href="mailto:nicolejiang9474@gmail.com">
              nicolejiang9474@gmail.com
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="bar bottombar">
        <div className="container footer-content">
          <p>© {new Date().getFullYear()} Nicole Jiang</p>
        </div>
      </footer>
    </>
  );
}
