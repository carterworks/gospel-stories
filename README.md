# scripture-stories-for-young-readers

A slideshow-style reformatting of the "Stories for Young Readers" books from The Church of Jesus Christ of Latter-Day Saints. Formatted for display on large screens

Includes:

* https://www.churchofjesuschrist.org/study/manual/book-of-mormon-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/old-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/new-testament-stories-for-young-readers?lang=eng
* https://www.churchofjesuschrist.org/study/manual/doctrine-and-covenants-stories-for-young-readers?lang=eng

## Run locally

Install dependencies with `nub`, then start Astro:

```sh
nub install
nub run dev
```

Build the static site with:

```sh
nub run build
```

## Deploy

Pushes to `main` build and deploy the site to Cloudflare Pages at `https://gospelstories.carter.works`.

The GitHub repository needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
