// Exports the solution (unmanaged and managed) through the Web API and writes the zips to ../solution/release.
// Then unpack the unmanaged zip with: pac solution unpack --zipfile solution/release/HalverdijkTransformatie_unmanaged.zip --folder solution/src --allowDelete
// (pac solution export --managed hung for 20+ minutes in this environment; the Web API action does not.)
import { writeFileSync } from "node:fs";
import { post, CONFIG } from "./dv.mjs";

for (const managed of [false, true]) {
  const res = await post("ExportSolution", { SolutionName: CONFIG.solution, Managed: managed }, { solution: null });
  const file = new URL(`../solution/release/${CONFIG.solution}_${managed ? "managed" : "unmanaged"}.zip`, import.meta.url);
  writeFileSync(file, Buffer.from(res.json.ExportSolutionFile, "base64"));
  console.log(`${managed ? "managed" : "unmanaged"}: ${file.pathname}`);
}
