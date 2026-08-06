import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  image: {
    domains: ["www.churchofjesuschrist.org"],
  },
  markdown: {
    processor: satteri(),
  },
});
