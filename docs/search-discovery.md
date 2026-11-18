# Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists Main, Side, Playground, and the site map using their canonical URLs.
- `GET /sitemap` is a compact directory linked from every footer, with two columns on desktop and one on phones. Subsections are indented; links open the corresponding gallery or experiment.
- Its displayed heading is “are you lost?”. The footer and URL keep “site map”; profile and contact links share their source with the Main and Side icons.
- Side uses `/side` for navigation, canonical URLs, social metadata, and the sitemap. The previous `/side-quests` route returns a permanent 308 redirect to `/side`, preserving query parameters.
- The homepage publishes `WebSite` data for the preferred site name plus page-specific `ProfilePage` and `Person` data connecting Nicole Jiang with the University of Toronto, LinkedIn, and GitHub.
- Canonical URLs, concise page titles, unique descriptions, authorship metadata, and explicit crawl and preview directives are included in page metadata.
- Every public page publishes Open Graph and Twitter large-image metadata using an edge-on black-hole image in `public/og.png` (1200 × 630), the title `Nicole Jiang - Personal Website`, and the embed description `Personal website and portfolio.`
- The sitemap contains canonical page locations only; ignored `priority` and `changefreq` hints are intentionally omitted.

Neocities referrals (`neocities.org` and its hosted subdomains) default to light mode for the browser-tab session. Saved manual theme choices take priority; other arrivals follow the system preference. Referrer blocking can prevent detecting a Neocities arrival. The site map also includes a collapsed Easter egg spoiler guide.
