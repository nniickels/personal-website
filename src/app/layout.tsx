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
