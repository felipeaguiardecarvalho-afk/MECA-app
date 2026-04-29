import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBlogDate, getAllBlogPosts, getBlogPost } from "@/lib/blog";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Artigo não encontrado",
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  return (
    <article className="w-full min-w-0 bg-gradient-to-b from-transparent via-white/50 to-indigo-50/20 py-4 sm:py-5 lg:py-7">
      <div className="container-meca pb-10 pt-3 sm:pb-12 sm:pt-4">
        <div className="mx-auto w-full max-w-none">
          <Link
            href="/blog"
            className="mb-6 inline-flex text-sm font-bold text-indigo-700 transition-colors hover:text-indigo-900"
          >
            Voltar para a biblioteca
          </Link>

          <header className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
              <span aria-hidden="true">•</span>
              <span>{post.author}</span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-pretty text-lg leading-8 text-slate-600">
              {post.description}
            </p>

            {post.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div
            className="mt-8 space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5 sm:p-8"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </div>
      </div>
    </article>
  );
}
