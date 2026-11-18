import { ViewCounter } from "./view-counter";
import { WebringConfirmation } from "./webring-confirmation";
export function SiteFooter() {
  return (
    <footer className="bar bottombar">
      <div className="container footer-content">
        <a className="text-btn" href="/sitemap">site map</a>
        <WebringConfirmation />
        <ViewCounter />
        <script src="https://webring.ca/embed.js" defer></script>
      </div>
    </footer>
  );
}
