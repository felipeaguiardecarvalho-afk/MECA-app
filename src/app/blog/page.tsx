import type { Metadata } from "next";
import Link from "next/link";
import { formatBlogDate, getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Artigos do MECA sobre comportamento, carreira, decisão e alta performance.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Biblioteca MECA",
    description:
      "Artigos sobre comportamento, carreira, decisão e alta performance.",
    type: "website",
    url: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  const postGridClass =
    posts.length === 1
      ? "mx-auto grid w-full max-w-none gap-5"
      : "mx-auto grid w-full max-w-none gap-5 md:grid-cols-2";

  return (
    <div className="w-full min-w-0 bg-gradient-to-b from-transparent via-white/50 to-indigo-50/20 py-4 sm:py-5 lg:py-7">
      <div className="container-meca pb-8 pt-3 sm:pb-10 sm:pt-4">
        <header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Conteúdo MECA
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Biblioteca MECA
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            Artigos para transformar autoconhecimento, comportamento e decisão
            em execução prática.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
            <p className="text-base text-slate-600">
              Nenhum artigo publicado ainda.
            </p>
          </div>
        ) : (
          <div className={postGridClass}>
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/10"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                  <span aria-hidden="true">•</span>
                  <span>{post.author}</span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition-colors group-hover:text-indigo-700"
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  {post.description}
                </p>

                {post.tags.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
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

                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-6 inline-flex text-sm font-bold text-indigo-700 transition-colors hover:text-indigo-900"
                >
                  Ler artigo
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
