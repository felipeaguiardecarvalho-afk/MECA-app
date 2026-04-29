import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { getSiteOrigin } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const posts = await getAllBlogPosts();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/fundamentos",
    "/arquetipos",
    "/diagnostico",
    "/blog",
  ].map((route) => ({
    url: `${origin}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
