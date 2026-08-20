# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).

## Design reference

Use [Boris Kafidov's portfolio](https://kafidov.dev/) and its
[source repository](https://github.com/l2ggy/portfolio) as the reference for the
site's minimalist layout, typography, top bar, theme transition, and animated
sun/moon control.

## Structure

- `src/app` contains the pages and styles.
- `src/worker.ts` connects the app to Cloudflare.
- `public` contains static images and icons.
- `tests` contains rendered-page checks.

## Local development

```bash
npm install
npm run dev
npm run build
```
