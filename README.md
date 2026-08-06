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

## Deploy

Connect the GitHub repository to Cloudflare Pages and use these build settings:

* Production branch: `main`
* Build command: `pnpm build`
* Build output directory: `dist`

Cloudflare Pages builds and deploys pushes to `main` at `https://gospelstories.carter.works`.
