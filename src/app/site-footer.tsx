import { ViewCounter } from "./view-counter";
import { WebringConfirmation } from "./webring-confirmation";
export function SiteFooter() {
  return (
    <footer className="bar bottombar">
      <div className="container footer-content">
        <p>© {new Date().getFullYear()} Nicole Jiang</p>
        <WebringConfirmation />
        <ViewCounter />
        <script src="https://webring.ca/embed.js" defer></script>
      </div>
    </footer>
  );
}
