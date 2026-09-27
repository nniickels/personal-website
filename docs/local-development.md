# Local development

Run these commands from the repository root. See [Runtime variables](runtime-variables.md) for environment configuration.

```bash
npm install
npm run dev
```

Production build and validation (Node.js 22.13.0 or newer):

```bash
npm run build
npm run typecheck
npm test
npx playwright install chromium webkit
npm run test:browser
```

`npm test` rebuilds the site. Browser tests use Chromium for desktop/phone interactions and WebKit for responsive layout and phone slider/drag checks. They use the most recent production build and start a server on `127.0.0.1:4173`, reusing an existing server there outside CI. Stop any stale server before testing a new build. Avoid rebuilding the shared `dist` directory while a production preview or browser check is running: the server can retain references to removed asset filenames. Use `npm run start` separately to preview the production site manually.

Run `npm run privacy:strip-gallery-metadata` after adding gallery JPEGs. It losslessly removes EXIF, XMP, IPTC, comments, and other nonessential application metadata while preserving image pixels, JFIF data, and colour profiles.
