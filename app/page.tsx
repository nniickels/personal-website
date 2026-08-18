import { ThemeToggle } from "./theme-toggle";

const profiles = [
  {
    name: "Google Maps",
    href: "https://www.google.com/maps/contrib/110017132181845047805/reviews/@24.3109578,143.3815865,3z/data=!3m1!4b1!4m3!8m2!3m1!1e1?authuser=1&entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D",
  },
  { name: "Pinterest", href: "https://ca.pinterest.com/nnickelsj/" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/nicolejitong-jiang/" },
] as const;

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-nav" aria-label="Primary navigation">
        <nav>
          <a href="/resume">Résumé</a>
          <a href="/cv">CV</a>
        </nav>
        <ThemeToggle />
      </header>

      <section className="intro" aria-labelledby="name">
        <p className="eyebrow">Personal website</p>
        <h1 id="name">Nicole Jiang</h1>
      </section>

      <section className="links" aria-labelledby="links-heading">
        <h2 id="links-heading">Elsewhere</h2>
        <ul>
          {profiles.map((profile) => (
            <li key={profile.name}>
              <a href={profile.href} target="_blank" rel="noreferrer">
                <span>{profile.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer>© {new Date().getFullYear()} Nicole Jiang</footer>
    </main>
  );
}
