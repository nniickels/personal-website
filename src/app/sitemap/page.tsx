import type { Metadata } from "next";
import { SiteHeader } from "../site-header";
import { SiteFooter } from "../site-footer";
import { NightSky } from "../night-sky";
import { sideQuestNavigation } from "../side-quests/data";
import { profileLinks, funLinks, neocitiesProfileLink } from "../profile-links";

export const metadata: Metadata = {
  title: "Site map — Nicole Jiang",
  description: "An index of Nicole Jiang’s profile, interests, guestbook, and astronomy experiments.",
  alternates: { canonical: "/sitemap" },
  openGraph: {
    type: "website", url: "/sitemap", siteName: "Nicole Jiang",
    title: "Nicole Jiang - Personal Website", description: "Personal website and portfolio.",
    images: [{ url: "/og.png?v=9", width: 1200, height: 630, alt: "Edge-on black hole with a glowing accretion disc" }],
  },
};

const mainSections = [
  ["education", "Education"], ["projects", "Research & Technical Projects"],
  ["talks", "Talks"], ["experience", "Service & Leadership"],
];
const experiments = [
  ["black-hole-growth", "Black-Hole Growth"], ["stellar-evolution", "Stellar Evolution"],
  ["gravitational-lensing", "Gravitational Lensing"], ["orbital-resonance", "Orbital Resonance"],
];
const elsewhereLinks = [...profileLinks, ...funLinks, neocitiesProfileLink];

export default function SiteMapPage() {
  return <>
    <SiteHeader page="sitemap" />
    <NightSky />
    <main className="container layout site-map-layout">
      <h1 className="site-map-title">are you lost?</h1>
      <nav className="site-map-groups" aria-label="Site map">
        <section>
          <h2><a className="text-link" href="/">/main (about me - academic)</a></h2>
          <ul className="site-map-links">
            {mainSections.map(([id, label]) => <li key={id}><a className="text-link" href={`/#${id}`}>{label}</a></li>)}
            <li><a className="text-link" href="/resume.pdf">Resume</a></li>
          </ul>
        </section>
        <section>
          <h2><a className="text-link" href="/side">/side (about me - personal)</a></h2>
          <ul className="site-map-links">
            {sideQuestNavigation.map(item => <li key={item.href} className={["#natural-things", "#scrapbook", "#pokemon-cards"].includes(item.href) ? "site-map-nested" : undefined}><a className="text-link" href={`/side${item.href}`}>{item.label}</a></li>)}
          </ul>
        </section>
        <section>
          <h2><a className="text-link" href="/playground">/playground (astro toy models)</a></h2>
          <ul className="site-map-links">
            {experiments.map(([id, label]) => <li key={id}><a className="text-link" href={`/playground#${id}`}>{label}</a></li>)}
          </ul>
        </section>
        <section>
          <h2>elsewhere and contact</h2>
          <ul className="site-map-links">
            {elsewhereLinks.map(link => <li key={link.href}><a className="text-link" href={link.href} target={link.href.startsWith("https:") ? "_blank" : undefined} rel={link.href.startsWith("https:") ? "noopener noreferrer" : undefined}>{link.name}</a></li>)}
          </ul>
        </section>
        <section>
          <details className="site-map-spoilers">
            <summary>easter eggs (spoilers)</summary>
            <ul className="site-map-links">
              <li>Dark mode: Background has twinkling stars of different colours and sizes. Occasionally, a shooting star will appear. Catch a shooting star to make a wish.</li>
              <li>On desktop, staying idle for 10 seconds in dark mode triggers a meteor shower. Moving or scrolling ends it.</li>
              <li>Light mode: Background has grey designs of florals and a butterfly. Experiments in /playground have a telescope viewing monitor overlay and border.</li>
              <li>On mobile and compact layouts: The site adapts to smaller screens and touchscreens, with slightly different styling, feature implementation, and reduced text.</li>

            </ul>
          </details>
        </section>
      </nav>
    </main>
    <SiteFooter />
  </>;
}
