import { ThemeToggle } from "./theme-toggle";

const profiles = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/nicolejitong-jiang/" },
  {
    name: "Google Maps",
    href: "https://www.google.com/maps/contrib/110017132181845047805/reviews/@24.3109578,143.3815865,3z/data=!3m1!4b1!4m3!8m2!3m1!1e1?authuser=1&entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D",
  },
  { name: "Pinterest", href: "https://ca.pinterest.com/nnickelsj/" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime" },
] as const;

export default function Home() {
  return (
    <>
      <header className="bar topbar">
        <div className="container bar-content">
          <a href="/" aria-label="Nicole Jiang home">nj</a>
          <div className="topbar-actions">
            <ThemeToggle />
            <a href="/resume">Résumé / CV</a>
          </div>
        </div>
      </header>

      <main className="container layout">
        <section className="hero">
          <h1>Nicole Jiang</h1>
          <nav className="profile-links" aria-label="External profiles">
            {profiles.map((profile, index) => (
              <span key={profile.name}>
                {index > 0 && <span className="separator" aria-hidden="true">|</span>}
                <a href={profile.href} target="_blank" rel="noreferrer">
                  {profile.name}
                </a>
              </span>
            ))}
          </nav>
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
