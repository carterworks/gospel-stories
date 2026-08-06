import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";

/** @typedef {{ directory: string, description: string, position: number, title: string, url: string, videoUrl?: string }} Story */

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const indexPath = join(root, "index.md");
const created = new Date().toISOString().slice(0, 10);
const concurrency = Math.max(1, Number(process.env.CONCURRENCY ?? 4));

const bookDirectories = new Map([
  ["Book of Mormon", "book-of-mormon"],
  ["Old Testament", "old-testament"],
  ["New Testament", "new-testament"],
  ["Doctrine and Covenants", "doctrine-and-covenants"],
]);

/** @param {number} milliseconds */
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * @param {string} index
 * @returns {Story[]}
 */
function parseStories(index) {
  return index
    .split(/^## /m)
    .slice(1)
    .flatMap((section) => {
      const [name, ...lines] = section.split(/\r?\n/);
      const directory = bookDirectories.get(name.trim());

      if (!directory) {
        throw new Error(`Unknown book section: ${name}`);
      }

      return [...lines.join("\n").matchAll(/^- \[([^\]]+)\]\(([^)]+)\)$/gm)].map(
        ([, title, url], position) => ({
          directory,
          description: name.trim(),
          position,
          title,
          url,
        }),
      );
    });
}

/** @param {string} value */
function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** @param {string} value */
function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

/** @param {string} markdown */
function extractSlides(markdown) {
  const firstImage = markdown.search(/^!\[[^\n]*\]\([^)]+\)$/m);
  const story = (firstImage < 0 ? markdown : markdown.slice(firstImage)).trim();

  if (!story) {
    return [];
  }

  const slides = [];
  let slide = [];

  for (const line of story.split("\n")) {
    if (/^!\[[^\n]*\]\([^)]+\)$/.test(line) && slide.length > 0) {
      slides.push(slide.join("\n").trim());
      slide = [];
    }

    slide.push(line);
  }

  slides.push(slide.join("\n").trim());
  return slides.filter(Boolean);
}

/**
 * @param {Story} story
 * @param {import("defuddle/node").DefuddleResponse} result
 */
function frontMatter(story, result) {
  const title = result.title || story.title;
  const published = formatDate(result.published);
  const video = story.videoUrl ? `video-url: ${story.videoUrl}` : "video-url:";

  return [
    "---",
    `title: ${title}`,
    `url: ${story.url}`,
    video,
    "---",
    "",
    "---",
    `title: ${JSON.stringify(title)}`,
    `source: ${JSON.stringify(story.url)}`,
    "author:",
    '  - "[[churchofjesuschrist.org]]"',
    `published: ${published}`,
    `created: ${created}`,
    `description: ${JSON.stringify(story.description)}`,
    "tags:",
    '  - "clippings"',
    "---",
  ].join("\n");
}

/** @param {Story} story */
async function fetchStory(story) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(story.url, {
        headers: { "user-agent": "scripture-stories-for-young-readers/1.0" },
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response.text();
    } catch (error) {
      if (attempt === 2) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch ${story.url}: ${message}`);
      }

      await sleep(500 * 2 ** attempt);
    }
  }

  throw new Error(`Failed to fetch ${story.url}`);
}

/**
 * @param {Story} story
 * @param {number} index
 */
async function convertStory(story, index) {
  const html = await fetchStory(story);
  const { document } = parseHTML(html);
  const result = await Defuddle(document, story.url, {
    markdown: true,
    removeImages: false,
  });
  const markdown = result.contentMarkdown ?? result.content ?? "";
  const slides = extractSlides(markdown);

  if (slides.length === 0) {
    throw new Error(`No slide content found for ${story.url}`);
  }

  const number = String(index + 1).padStart(2, "0");
  const filename = `${number}-${slugify(result.title || story.title)}.md`;
  const outputPath = join(root, "stories", story.directory, filename);
  let videoUrl = "";

  try {
    const existing = await readFile(outputPath, "utf8");
    videoUrl = existing.match(/^video-url:\s*(.*)$/m)?.[1]?.trim() ?? "";
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const output = `${frontMatter({ ...story, title: result.title || story.title, videoUrl }, result)}\n\n${slides.join("\n\n---\n\n")}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
  console.log(outputPath.replace(`${root}/`, ""));
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T, index: number) => Promise<void>} callback
 */
async function mapWithConcurrency(items, callback) {
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await callback(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
}

const index = await readFile(indexPath, "utf8");
const stories = parseStories(index);

await mapWithConcurrency(stories, (story) => convertStory(story, story.position));
console.log(`Converted ${stories.length} stories.`);
