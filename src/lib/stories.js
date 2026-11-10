import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

/** @typedef {{ alt: string, src: string }} StoryImage */
/** @typedef {{ images: StoryImage[], html: string }} Slide */
/** @typedef {{ book: string, bookTitle: string, description: string, slug: string, source: string, title: string, videoUrl: string, slides: Slide[] }} Story */
/** @typedef {{ slug: string, title: string, stories: Story[] }} Book */
/** @typedef {{ title: string, books: Book[] }} Collection */

const storiesDirectory = join(process.cwd(), "stories");
const collectionDefinitions = [
  {
    title: "Stories for Young Readers",
    books: [
      ["book-of-mormon", "Book of Mormon"],
      ["old-testament", "Old Testament"],
      ["new-testament", "New Testament"],
      ["doctrine-and-covenants", "Doctrine and Covenants"],
    ],
  },
  {
    title: "Scripture Stories",
    books: [
      ["book-of-mormon-stories", "Book of Mormon Stories"],
      ["old-testament-stories", "Old Testament Stories"],
      ["new-testament-stories", "New Testament Stories"],
      ["doctrine-and-covenants-stories", "Doctrine and Covenants Stories"],
    ],
  },
];

/** @type {Promise<Collection[]> | undefined} */
let collectionsPromise;
let markdownRendererPromise;

/**
 * @param {string} block
 * @param {string} key
 * @returns {string}
 */
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

/** @param {string} markdown */
async function renderMarkdown(markdown) {
  if (!markdown) {
    return "";
  }

  markdownRendererPromise ??= createSatteriMarkdownProcessor({ syntaxHighlight: false });
  const renderer = await markdownRendererPromise;
  const result = await renderer.render(markdown, { frontmatter: {} });
  return result.code;
}

/**
 * @param {string} source
 * @returns {Promise<Slide>}
 */
async function parseSlide(source) {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [...source.matchAll(imagePattern)].map(([, alt, src]) => ({ alt, src }));
  const text = source.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "").trim();

  return {
    images,
    html: await renderMarkdown(text),
  };
}

/**
 * @param {string} bookSlug
 * @param {string} bookTitle
 * @param {string} filename
 * @returns {Promise<Story>}
 */
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
    videoUrl: readValue(metadata, "video-url"),
    slides,
  };
}

/**
 * @param {string} slug
 * @param {string} title
 * @returns {Promise<Book>}
 */
async function loadBook(slug, title) {
  const filenames = (await readdir(join(storiesDirectory, slug)))
    .filter((filename) => filename.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const stories = await Promise.all(filenames.map((filename) => parseStory(slug, title, filename)));

  return { slug, title, stories };
}

/** @returns {Promise<Collection[]>} */
export function getCollections() {
  collectionsPromise ??= Promise.all(
    collectionDefinitions.map(async ({ title, books }) => ({
      title,
      books: await Promise.all(books.map(([slug, bookTitle]) => loadBook(slug, bookTitle))),
    })),
  );
  return collectionsPromise;
}

export async function getStories() {
  const collections = await getCollections();
  return collections.flatMap((collection) => collection.books.flatMap((book) => book.stories));
}

/**
 * @param {Story} story
 * @param {number} slideNumber
 */
export function getSlidePath(story, slideNumber) {
  return `/${story.book}/${story.slug}/${String(slideNumber).padStart(2, "0")}/`;
}
