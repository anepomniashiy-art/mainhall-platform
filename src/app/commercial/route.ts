import {readFileSync} from "node:fs";
import {join} from "node:path";

// Serve the preserved commercial document directly, outside the residential layout.
// The original snapshot and checksums are retained separately for rollback.
export const dynamic = "force-static";
export function GET() {
  const source = readFileSync(join(process.cwd(), "public/legacy-mainhall/index.html"), "utf8");
  const prefix = process.env.GITHUB_PAGES === "true" ? "/mainhall-platform" : "";
  const html = source.replaceAll("/legacy-mainhall/assets/", `${prefix}/legacy-mainhall/assets/`);
  return new Response(html, {headers: {"Content-Type": "text/html; charset=utf-8"}});
}
