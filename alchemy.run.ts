import { adopt } from "alchemy/AdoptPolicy";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Stage from "alchemy/Stage";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "gospelstories",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const stage = yield* Stage.Stage;

    const site = yield* Cloudflare.Website.StaticSite("Website", {
      name: "gospelstories",
      compatibility: { date: "2024-09-03" },
      command: "pnpm run build",
      outdir: "dist",
      dev: { command: "pnpm run dev" },
      assets: { notFoundHandling: "404-page" },
    });

    if (stage === "prod") {
      const zone = yield* Cloudflare.Zone.Zone("CarterWorks", {
        name: "carter.works",
      }).pipe(adopt(true));

      // The proxied record the route depends on. It currently points at the
      // Pages project being retired; adopt it verbatim so `gospelstories`'s
      // DNS is left untouched until its content is confirmed in Cloudflare.
      yield* Cloudflare.DNS.Record("GospelStoriesSubdomain", {
        zoneId: zone.zoneId,
        name: "gospelstories.carter.works",
        type: "CNAME",
        content: "gospelstories.pages.dev",
        proxied: true,
      }).pipe(adopt(true));

      yield* Cloudflare.Workers.WorkerRoute("GospelStoriesRoute", {
        zoneId: zone.zoneId,
        pattern: "gospelstories.carter.works/*",
        script: site.workerName,
      }).pipe(adopt(true));
    }

    return { url: site.url };
  }),
);
