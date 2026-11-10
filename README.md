# scripture-stories-for-young-readers

A slideshow-style reformatting of the "Stories for Young Readers" and "Scripture Stories" books from The Church of Jesus Christ of Latter-Day Saints. Formatted for display on large screens

Includes:

* https://www.churchofjesuschrist.org/study/manual/book-of-mormon-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/old-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/new-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/doctrine-and-covenants-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/children/scripture-stories?lang=eng (Book of Mormon, Old Testament, New Testament, and Doctrine and Covenants Stories)

The Stories for Young Readers files have hand edits, so re-scrape only the books you need, by directory:

```sh
node scripts/convert-stories.mjs book-of-mormon-stories new-testament-stories
```

## Run locally

Install dependencies with `pnpm`, then start Astro with `nub`:

```sh
pnpm install
nub run dev
```

Build the static site with:

```sh
nub run build
```

## Deployment

The site deploys to Cloudflare as a Worker serving static assets, defined in
[`alchemy.run.ts`](./alchemy.run.ts). Alchemy builds the site, hashes `dist/`,
and uploads it. Pushes to `main` deploy automatically via GitHub Actions.

```sh
pnpm run deploy
```

Locally, authenticate first with `pnpm exec alchemy profile edit`. CI runs the
same command as `alchemy deploy --stage prod` using `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`.
