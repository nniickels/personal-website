import { Portfolio } from "./portfolio";
import { siteDescription } from "./layout";

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://nicolejiang.com/#website",
      url: "https://nicolejiang.com/",
      name: "Nicole Jiang",
      description: siteDescription,
      inLanguage: "en-CA",
      author: { "@id": "https://nicolejiang.com/#nicole-jiang" },
    },
    {
      "@type": "ProfilePage",
      "@id": "https://nicolejiang.com/#profile-page",
      url: "https://nicolejiang.com/",
      name: "Nicole Jiang",
      isPartOf: { "@id": "https://nicolejiang.com/#website" },
      mainEntity: {
        "@type": "Person",
        "@id": "https://nicolejiang.com/#nicole-jiang",
        name: "Nicole Jiang",
        url: "https://nicolejiang.com/",
        description: siteDescription,
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "University of Toronto",
          url: "https://www.utoronto.ca/",
        },
        knowsAbout: ["Astronomy", "Physics", "Computational astrophysics", "Black holes"],
        sameAs: [
          "https://www.linkedin.com/in/nicolejitong-jiang/",
          "https://github.com/nniickels",
        ],
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <Portfolio mode="serious" />
    </>
  );
}
