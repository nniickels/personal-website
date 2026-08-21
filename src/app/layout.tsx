import type { Metadata } from "next";
import "./globals.css";

const description = "Astronomy and physics undergraduate at the University of Toronto.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nicolejiang.com"),
  title: "Nicole Jiang",
  description,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon-32.png?v=3", type: "image/png", sizes: "32x32" }],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nicole Jiang",
    title: "Nicole Jiang",
    description,
    images: [
      {
        url: "/og.png?v=1",
        width: 1200,
        height: 630,
        alt: "Nicole Jiang — astronomy and physics undergraduate at U of T",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nicole Jiang",
    description,
    images: ["/og.png?v=1"],
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
