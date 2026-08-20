import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const profileManifest = "C:/Users/l2910/.dsh/profiles/web/package.json";
const req = createRequire(profileManifest);

let pluginEntry;
try {
  pluginEntry = req.resolve("dsh-vision-config");
  console.log("plugin entry:", pluginEntry);
} catch (e) {
  console.log("resolve plugin FAILED:", e.message);
  process.exit(1);
}

for (const dep of ["@deepseek-ai/cordis", "@deepseek-ai/dsh-attachment"]) {
  try {
    console.log("from profile resolve", dep, "->", req.resolve(dep));
  } catch (e) {
    console.log("from profile resolve", dep, "FAILED:", e.message);
  }
}

// Now try to actually import the plugin (from the profile anchor), which
// exercises the plugin's own internal imports.
try {
  const mod = await import(pathToFileURL(pluginEntry).href);
  console.log("plugin import OK. exports keys:", Object.keys(mod));
} catch (e) {
  console.log("plugin import FAILED:");
  console.log(e && e.message ? e.message : e);
}
