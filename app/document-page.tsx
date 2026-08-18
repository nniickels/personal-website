import { ThemeToggle } from "./theme-toggle";

type DocumentPageProps = {
  label: string;
  title: string;
  description: string;
};

export function DocumentPage({ label, title, description }: DocumentPageProps) {
  return (
    <main className="site-shell document-page">
      <header className="site-nav" aria-label="Primary navigation">
        <nav>
          <a href="/">Home</a>
          <a href={title === "Résumé" ? "/cv" : "/resume"}>
            {title === "Résumé" ? "CV" : "Résumé"}
          </a>
        </nav>
        <ThemeToggle />
      </header>

      <article>
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p className="document-note">{description}</p>
        <p className="document-status">Content coming soon.</p>
      </article>

      <footer>Nicole Jiang</footer>
    </main>
  );
}
