import {readFileSync} from "node:fs";
import {join} from "node:path";

// Serve the preserved commercial document directly, outside the residential layout.
// The custom domain main-hall.ru is hosted at the origin root: /mainhall-platform/
// is NOT a valid asset prefix once the Pages CNAME is active.
export const dynamic = "force-static";
export function GET() {
  const source = readFileSync(join(process.cwd(), "public/legacy-mainhall/index.html"), "utf8");
  return new Response(source, {headers: {"Content-Type": "text/html; charset=utf-8"}});
}
