import { ViewCounter } from "./view-counter";
export function SiteFooter() {
  return (
    <footer className="bar bottombar">
      <div className="container footer-content">
        <p>© {new Date().getFullYear()} Nicole Jiang</p>
        <div className="footer-webring" data-webring="ca" data-member="nicole-jiang" />
        <ViewCounter />
        <script src="https://webring.ca/embed.js" defer></script>
      </div>
    </footer>
  );
}
