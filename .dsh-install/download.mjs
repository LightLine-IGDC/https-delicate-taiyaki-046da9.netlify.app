import { get as httpsGet } from "node:https";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.argv[2];
const dest = process.argv[3];

if (!url || !dest) {
  console.error("usage: node download.mjs <url> <dest>");
  process.exit(2);
}

mkdirSync(dirname(dest), { recursive: true });

function get(u, redirects = 0) {
  if (redirects > 10) {
    console.error("too many redirects");
    process.exit(1);
  }
  httpsGet(u, { headers: { "User-Agent": "dsh-install" } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      const next = new URL(res.headers.location, u).toString();
      console.error(`redirect -> ${next}`);
      return get(next, redirects + 1);
    }
    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode} for ${u}`);
      res.resume();
      process.exit(1);
    }
    const out = createWriteStream(dest);
    res.pipe(out);
    out.on("finish", () => {
      out.close();
      console.log(`saved ${dest}`);
    });
  }).on("error", (e) => {
    console.error(`ERR ${e.message}`);
    process.exit(1);
  });
}

get(url);
