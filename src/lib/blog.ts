import fs from "node:fs/promises";
import path from "node:path";

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
};

export type BlogPost = BlogPostMeta & {
  content: string;
  html: string;
};

type FrontmatterValue = string | string[];

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatterValue(value: string): FrontmatterValue {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => stripQuotes(item))
      .filter(Boolean);
  }
  return stripQuotes(trimmed);
}

function parseFrontmatter(raw: string): {
  data: Record<string, FrontmatterValue>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Blog post must start with frontmatter delimited by ---");
  }

  const [, frontmatter, content] = match;
  const data: Record<string, FrontmatterValue> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    if (key) data[key] = parseFrontmatterValue(value);
  }

  return { data, content: content.trim() };
}

function requireString(
  data: Record<string, FrontmatterValue>,
  key: string,
  slug: string,
): string {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Blog post "${slug}" is missing "${key}" frontmatter`);
  }
  return value;
}

function requireStringArray(
  data: Record<string, FrontmatterValue>,
  key: string,
): string[] {
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isSafeHref(href: string): boolean {
  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:")
  );
}

function renderInlineMarkdown(value: string): string {
  let rendered = "";
  let remaining = value;
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/;

  while (remaining.length > 0) {
    const match = remaining.match(linkPattern);
    if (!match || match.index === undefined) {
      rendered += escapeHtml(remaining);
      break;
    }

    rendered += escapeHtml(remaining.slice(0, match.index));
    const [, text, href] = match;
    const safeHref = isSafeHref(href) ? href : "#";
    rendered += `<a class="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition-colors hover:text-indigo-900" href="${escapeHtml(
      safeHref,
    )}">${escapeHtml(text)}</a>`;
    remaining = remaining.slice(match.index + match[0].length);
  }

  return rendered
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-slate-800">$1</code>');
}

function renderParagraph(lines: string[]): string {
  return `<p class="text-lg leading-8 text-slate-700">${renderInlineMarkdown(
    lines.join(" "),
  )}</p>`;
}

export function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(renderParagraph(paragraph));
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      html.push(
        `<ul class="my-6 space-y-3 pl-6 text-lg leading-8 text-slate-700">${listItems
          .map(
            (item) =>
              `<li class="list-disc marker:text-indigo-500">${renderInlineMarkdown(
                item,
              )}</li>`,
          )
          .join("")}</ul>`,
      );
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      html.push(
        '<hr class="my-10 border-0 border-t border-slate-200" />',
      );
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = renderInlineMarkdown(heading[2]);
      html.push(
        level === 2
          ? `<h2 class="mt-10 text-3xl font-bold tracking-tight text-slate-950">${text}</h2>`
          : `<h3 class="mt-8 text-2xl font-bold tracking-tight text-slate-950">${text}</h3>`,
      );
      continue;
    }

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      listItems.push(listItem[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

async function getBlogPostFilenames(): Promise<string[]> {
  try {
    const entries = await fs.readdir(BLOG_CONTENT_DIR);
    return entries.filter((entry) => entry.endsWith(".md")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const filenames = await getBlogPostFilenames();
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const slug = slugFromFilename(filename);
      const raw = await fs.readFile(path.join(BLOG_CONTENT_DIR, filename), "utf8");
      const { data } = parseFrontmatter(raw);

      return {
        slug,
        title: requireString(data, "title", slug),
        description: requireString(data, "description", slug),
        date: requireString(data, "date", slug),
        author: requireString(data, "author", slug),
        tags: requireStringArray(data, "tags"),
      };
    }),
  );

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const filename = `${slug}.md`;

  try {
    const raw = await fs.readFile(path.join(BLOG_CONTENT_DIR, filename), "utf8");
    const { data, content } = parseFrontmatter(raw);

    return {
      slug,
      title: requireString(data, "title", slug),
      description: requireString(data, "description", slug),
      date: requireString(data, "date", slug),
      author: requireString(data, "author", slug),
      tags: requireStringArray(data, "tags"),
      content,
      html: renderMarkdownToHtml(content),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function formatBlogDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
