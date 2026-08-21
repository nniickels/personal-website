import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const image = host ? `${protocol}://${host}/og.png` : undefined;

  return {
    title: "Nicole Jiang",
    description: "The personal website of Nicole Jiang.",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
      shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      title: "Nicole Jiang",
      description: "The personal website of Nicole Jiang.",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Nicole Jiang",
      description: "The personal website of Nicole Jiang.",
      images: image ? [image] : undefined,
    },
  };
}

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
