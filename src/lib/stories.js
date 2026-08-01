import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

const storiesDirectory = join(process.cwd(), "stories");
const bookDefinitions = [
  ["book-of-mormon", "Book of Mormon"],
  ["old-testament", "Old Testament"],
  ["new-testament", "New Testament"],
  ["doctrine-and-covenants", "Doctrine and Covenants"],
];

let booksPromise;
let markdownRendererPromise;

function readValue(block, key) {
  const match = block.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  const value = match?.[1]?.trim() ?? "";

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  return value;
}

async function renderMarkdown(markdown) {
  if (!markdown) {
    return "";
  }

  markdownRendererPromise ??= createSatteriMarkdownProcessor({ syntaxHighlight: false });
  const renderer = await markdownRendererPromise;
  const result = await renderer.render(markdown, { frontmatter: {} });
  return result.code;
}

async function parseSlide(source) {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [...source.matchAll(imagePattern)].map(([, alt, src]) => ({ alt, src }));
  const text = source.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "").trim();

  return {
    images,
    html: await renderMarkdown(text),
  };
}

async function parseStory(bookSlug, bookTitle, filename) {
  const markdown = await readFile(join(storiesDirectory, bookSlug, filename), "utf8");
  const match = markdown.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n\r?\n---\r?\n([\s\S]*?)\r?\n---\r?\n\r?\n([\s\S]*)$/,
  );

  if (!match) {
    throw new Error(`Invalid story Markdown: ${bookSlug}/${filename}`);
  }

  const metadata = match[1];
  const details = match[2];
  const title = readValue(metadata, "title");
  const slides = await Promise.all(
    match[3]
      .split(/\r?\n\r?\n---\r?\n\r?\n/)
      .map((slide) => parseSlide(slide.trim())),
  );

  return {
    book: bookSlug,
    bookTitle,
    description: readValue(details, "description") || readValue(metadata, "description"),
    slug: basename(filename, ".md"),
    source: readValue(details, "source") || readValue(metadata, "url"),
    title,
    slides,
  };
}

async function loadBooks() {
  return Promise.all(
    bookDefinitions.map(async ([slug, title]) => {
      const filenames = (await readdir(join(storiesDirectory, slug)))
        .filter((filename) => filename.endsWith(".md"))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
      const stories = await Promise.all(
        filenames.map((filename) => parseStory(slug, title, filename)),
      );

      return { slug, title, stories };
    }),
  );
}

export function getBooks() {
  booksPromise ??= loadBooks();
  return booksPromise;
}

export async function getStories() {
  const books = await getBooks();
  return books.flatMap((book) => book.stories);
}

export function getSlidePath(story, slideNumber) {
  return `/${story.book}/${story.slug}/${String(slideNumber).padStart(2, "0")}/`;
}
