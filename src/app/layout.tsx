import type { Metadata } from "next";
import "./globals.css";

export const siteDescription =
  "Nicole Jiang is an astronomy and physics undergraduate at the University of Toronto working on black-hole growth and computational astrophysics.";

const socialDescription = "Personal website and portfolio.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nicolejiang.com"),
  title: "Nicole Jiang - Personal Website",
  description: siteDescription,
  applicationName: "Nicole Jiang",
  authors: [{ name: "Nicole Jiang", url: "/" }],
  creator: "Nicole Jiang",
  publisher: "Nicole Jiang",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon-32.png?v=3", type: "image/png", sizes: "32x32" }],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nicole Jiang",
    title: "Nicole Jiang - Personal Website",
    description: socialDescription,
    images: [
      {
        url: "/og.png?v=9",
        width: 1200,
        height: 630,
        alt: "Edge-on black hole with a glowing accretion disc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicole Jiang - Personal Website",
    description: socialDescription,
    images: ["/og.png?v=9"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-title-font-loading="" suppressHydrationWarning>
      <head>
        <style>{`html[data-title-font-loading] .hero h1,html[data-title-font-loading] .playground-intro h1{visibility:hidden}`}</style>
        <noscript>
          <style>{`.hero h1,.playground-intro h1{visibility:visible!important}`}</style>
        </noscript>
        <link
          rel="preload"
          href="/fonts/mrs-saint-delafield-titles.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function ready(){document.fonts.load('400 16px "Mrs Saint Delafield"','Nicole Jiang Playground').then(function(fonts){if(fonts.length)document.documentElement.removeAttribute('data-title-font-loading')}).catch(function(){})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('portfolio-theme-override');var d=(t==='dark'||t==='light')?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=d}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
