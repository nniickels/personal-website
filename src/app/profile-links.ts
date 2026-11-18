import type { SocialLink } from "./icons";

export const profileLinks: readonly SocialLink[] = [
  { name: "GitHub", href: "https://github.com/nniickels", icon: "github" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/nicolejitong-jiang/", icon: "linkedin" },
  { name: "Email", href: "mailto:nicolejiang9474@gmail.com", icon: "email" },
] as const;

export const funLinks: readonly SocialLink[] = [
  { name: "Pinterest", href: "https://www.pinterest.com/nnickelsj/_created/", icon: "pinterest" },
  { name: "stats.fm", href: "https://stats.fm/user/nnickels?range=lifetime", icon: "spotify" },
  {
    name: "Google Maps",
    href: "https://maps.app.goo.gl/qet6vnym45NpTQ2XA?g_st=ic",
    icon: "maps",
  },
  { name: "AniList", href: "https://anilist.co/user/niickels/", icon: "anilist" },
  { name: "Instagram", href: "https://www.instagram.com/nicolejiang_/", icon: "instagram" },
] as const;

export const neocitiesProfileLink = { name: "Neocities", href: "https://neocities.org/site/nickels" } as const;
