# Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists the Main Quest, Side Quests, and Playground pages using their canonical URLs.
- The homepage publishes `WebSite` data for the preferred site name plus page-specific `ProfilePage` and `Person` data connecting Nicole Jiang with the University of Toronto, LinkedIn, and GitHub.
- Canonical URLs, concise page titles, unique descriptions, authorship metadata, and explicit crawl and preview directives are included in page metadata.
- Every public page publishes Open Graph and Twitter large-image metadata using `public/og.png`, the title `Nicole Jiang`, and the embed description `Personal website and portfolio.`
- The sitemap contains canonical page locations only; ignored `priority` and `changefreq` hints are intentionally omitted.
