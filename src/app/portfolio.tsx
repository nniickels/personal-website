import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { NightSky } from "./night-sky";
import { ExternalLinkIcon, SocialLinks } from "./icons";
import { PageTitle } from "./page-title";
import { SeriousContent } from "./serious-content";
import { FunContent } from "./side-quests/fun-content";
import type { SocialLink } from "./icons";
type Mode = "serious" | "fun";
const profileLinks: readonly SocialLink[] = [
  { name: "GitHub", href: "https://github.com/nniickels", icon: "github" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/nicolejitong-jiang/", icon: "linkedin" },
  { name: "Email", href: "mailto:nicolejiang9474@gmail.com", icon: "email" },
] as const;

const funLinks: readonly SocialLink[] = [
  { name: "Pinterest", href: "https://www.pinterest.com/nnickelsj/_created/", icon: "pinterest" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime", icon: "spotify" },
  {
    name: "Google Maps",
    href: "https://maps.app.goo.gl/qet6vnym45NpTQ2XA?g_st=ic",
    icon: "maps",
  },
  { name: "AniList", href: "https://anilist.co/user/niickels/", icon: "anilist" },
  { name: "Instagram", href: "https://www.instagram.com/nicolejiang_/", icon: "instagram" },
] as const;

export function Portfolio({ mode }: { mode: Mode }) {
  return (
    <>
      <SiteHeader page={mode} />

      <NightSky />

      <main className={`container layout mode-${mode}`}>
        <section className="hero">
          <div className="hero-profile">
            <div className="hero-heading">
              <PageTitle title="nicole jiang" />
              <SocialLinks links={mode === "serious" ? profileLinks : funLinks} />
            </div>
            {mode === "serious" ? (
              <p className="subtitle">
                astrophysics undergrad @ uoft
                <span className="subtitle-separator" aria-hidden="true">{"\u00a0|\u00a0"}</span>
                <a className="text-link" href="/resume.pdf" target="_blank" rel="noreferrer">
                  resume<ExternalLinkIcon />
                </a>
              </p>
            ) : (
              <p className="subtitle">aliases: nic / nickel / nickels / nnickels / nnickelsj</p>
            )}
          </div>
          <div className="hero-description">
            {mode === "serious" ? (
              <>
                <p className="mobile-only">
                  Hello! Welcome to my personal website. Below is a quick overview of my academic profile.
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
                  A little collection of all things personal (outside of astrophysics and career-goal-adjacent stuff)!
                </p>
                <p className="desktop-only">
                  Welcome! This page is a little collection
                  of all things personal (outside of astrophysics and career-goal-adjacent stuff). I'm also very interested in philosophy (namely metaphysics and epistemology, though interdisciplinary questions are my favourite). 
                  I like being able to put whatever I want here as the webmaster :D
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
