# scripture-stories-for-young-readers

A slideshow-style reformatting of the "Stories for Young Readers" books from The Church of Jesus Christ of Latter-Day Saints. Formatted for display on large screens

Includes:

* https://www.churchofjesuschrist.org/study/manual/book-of-mormon-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/old-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/new-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/doctrine-and-covenants-stories-for-young-readers?lang=eng

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
