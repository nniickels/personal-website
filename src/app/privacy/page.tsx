import type { Metadata } from "next";
import { ThemeToggle } from "../theme-toggle";

export const metadata: Metadata = {
  title: "Privacy Policy | Nicole Jiang",
  description: "Privacy Policy for Nicole Jiang Portfolio Analytics at nicolejiang.com.",
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
        <h1>Privacy Policy</h1>
        <p>Last updated: Aug 21, 2026</p>
        <p>
          This Privacy Policy applies to Nicole Jiang Portfolio Analytics, a personal,
          read-only portfolio integration operated at nicolejiang.com.
        </p>

        <section>
          <h2>Information from portfolio visitors</h2>
          <p>
            This site does not ask visitors to create accounts or submit personal information.
            A visitor&apos;s light or dark theme and Main Quest or Side Quests preference may be
            stored locally in that visitor&apos;s browser. Cloudflare may process standard technical
            request information, such as an IP address and browser information, to host, secure,
            and maintain the site.
          </p>
        </section>

        <section>
          <h2>Pinterest data</h2>
          <p>
            The Pinterest integration authenticates only Nicole Jiang&apos;s own Pinterest business
            account. It uses Pinterest&apos;s user-account API to retrieve and display one aggregate
            statistic: Nicole&apos;s monthly viewer count. It does not read Pins or boards, publish or
            schedule content, allow other people to connect accounts, or access other Pinners&apos;
            data.
          </p>
        </section>

        <section>
          <h2>Other connected services</h2>
          <p>
            The site may display selected public or authorized statistics from Nicole&apos;s
            stats.fm, Clash Royale, and Steam accounts. These connections run on the server and
            do not give visitors access to account credentials. Links to third-party websites are
            governed by those services&apos; own privacy policies.
          </p>
        </section>

        <section>
          <h2>How connected data is used and stored</h2>
          <p>
            Connected-service data is used only to display Nicole&apos;s own statistics on this
            portfolio. API credentials are stored as encrypted Cloudflare Worker secrets. The
            Pinterest monthly viewer count is requested server-side and may be cached briefly for
            performance; it is not stored in a separate portfolio database. Credentials are
            removed when an integration is disconnected.
          </p>
        </section>

        <section>
          <h2>Sharing and sale of data</h2>
          <p>
            Connected-service data is not sold, rented, used for advertising, used to profile
            visitors, or used to train artificial-intelligence models. Cloudflare processes the
            limited technical information needed to provide the site&apos;s hosting and security.
          </p>
        </section>

        <section>
          <h2>Access, deletion, and revocation</h2>
          <p>
            Nicole can revoke the Pinterest app&apos;s access from Pinterest account settings. To ask
            about the data used by this site or request removal of a connected integration and its
            credentials, use the contact address below.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            This policy may be updated when the portfolio or its connected services change. The
            latest revision date appears at the top of this page.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions or requests, email{" "}
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
          <a className="text-link" href="/">
            Home
          </a>
        </div>
      </footer>
    </>
  );
}
