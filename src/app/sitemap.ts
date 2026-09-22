import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://nicolejiang.com/",
    },
    {
      url: "https://nicolejiang.com/side",
    },
    {
      url: "https://nicolejiang.com/playground",
    },
  ];
}
