import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://nicolejiang.com/",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://nicolejiang.com/side-quests",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://nicolejiang.com/playground",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
