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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t,n=false,v,external=false;
              try{t=localStorage.getItem('portfolio-theme-override')}catch(e){}
              try{var r=new URL(document.referrer),h=r.hostname;n=h==='neocities.org'||h.endsWith('.neocities.org');external=r.origin!==location.origin}catch(e){}
              try{
                var a=performance.getEntriesByType('navigation')[0],arrival=!a||a.type==='navigate';
                if(n){sessionStorage.setItem('portfolio-neocities-visit','1');if(arrival)sessionStorage.removeItem('portfolio-neocities-theme')}
                else if(external&&arrival){sessionStorage.removeItem('portfolio-neocities-visit');sessionStorage.removeItem('portfolio-neocities-theme')}
                n=n||sessionStorage.getItem('portfolio-neocities-visit')==='1';v=sessionStorage.getItem('portfolio-neocities-theme');
              }catch(e){}
              if(n){document.documentElement.dataset.themeReferral='neocities';t=(v==='light'||v==='dark')?v:'light'}
              document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
            })()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
