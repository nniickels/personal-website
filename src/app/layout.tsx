import type { Metadata } from "next";
import "./globals.css";

export const siteDescription =
  "Nicole Jiang is an astronomy and physics undergraduate at the University of Toronto working on black-hole growth and computational astrophysics.";

// Prevent social crawlers from falling back to the SEO description while keeping the card visual-only.
const socialDescription = "\u200B";

export const metadata: Metadata = {
  metadataBase: new URL("https://nicolejiang.com"),
  title: "Nicole Jiang",
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
    title: "Nicole Jiang",
    description: socialDescription,
    images: [
      {
        url: "/og.png?v=8",
        width: 1200,
        height: 630,
        alt: "Nicole Jiang — astrophysics at U of T",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicole Jiang",
    description: socialDescription,
    images: ["/og.png?v=8"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
