import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { NightSky } from "./night-sky";
import { ExternalLinkIcon, SocialLinks } from "./icons";
import { SeriousContent } from "./serious-content";
import { FunContent } from "./side-quests/fun-content";
import type { SocialLink } from "./icons";
type Mode = "serious" | "fun";
const seriousLinks: readonly SocialLink[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/nicolejitong-jiang/",
    icon: "linkedin",
  },
  { name: "GitHub", href: "https://github.com/nniickels", icon: "github" },
  { name: "Email", href: "mailto:nicolejiang9474@gmail.com", icon: "email" },
] as const;

const funLinks: readonly SocialLink[] = [
  { name: "Pinterest", href: "https://ca.pinterest.com/nnickelsj/", icon: "pinterest" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime", icon: "spotify" },
  { name: "Instagram", href: "https://www.instagram.com/nicolejiang_/", icon: "instagram" },
  {
    name: "Google Maps",
    href: "https://maps.app.goo.gl/qet6vnym45NpTQ2XA?g_st=ic",
    icon: "maps",
  },
] as const;

export function Portfolio({ mode }: { mode: Mode }) {
  const socialLinks = mode === "serious" ? seriousLinks : funLinks;

  return (
    <>
      <SiteHeader page={mode} />

      <NightSky />

      <main className={`container layout mode-${mode}`}>
        <section className="hero">
          <div className="hero-heading">
            <h1>Nicole Jiang</h1>
            <SocialLinks links={socialLinks} />
          </div>
          <p className="subtitle">
            {mode === "serious" ? (
              <>
                astrophysics undergrad @ uoft
                <span className="subtitle-separator" aria-hidden="true">
                  |
                </span>
                <a className="text-link" href="/resume.pdf" target="_blank" rel="noreferrer">
                  resume
                  <ExternalLinkIcon />
                </a>
              </>
            ) : "nic / nickel / nickels / nnickels / nnickelsj"}
          </p>
          <div className="hero-description">
            {mode === "serious" ? (
              <>
                <p className="mobile-only">
                  Hello! Welcome to my personal website (best experienced on desktop). Below is a quick overview of my academic profile.
                </p>
                <p className="desktop-only">
                  Hello! I'm Nicole, an Astronomy and Physics Specialist student at the University
                  of Toronto. Welcome to my personal website! My research interests include galaxy formation and evolution,
                  observational cosmology, early-universe physics, and stellar remnants. Below is a
                  quick overview of my academic profile. Feel free to reach out via email or connect
                 on LinkedIn :))
                </p>

              </>
            ) : (
              <>
                <p className="mobile-only">
                  I also have many interests, collections, and hobbies outside of astrophysics and career-goal-adjacent stuff!
                </p>
                <p className="desktop-only">
                  Hi!! It's Nicole again. Outside of astrophysics and career-goal-adjacent stuff, I'm
                  very interested in philosophy (namely metaphysics and epistemology, though
                  interdisciplinary questions are my favourite). I have many interests, collections,
                  and hobbies I'd like to share with you on this page... Please enjoy!
                </p>
              </>
            )}
          </div>
        </section>
        {mode === "serious" ? <SeriousContent /> : <FunContent />}
      </main>

      <SiteFooter />
    </>
  );
}
