import { NextRequest, NextResponse } from "next/server";
import { editorialProjects } from "@/lib/editorial-projects";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().toLocaleLowerCase("ru");
  const segment = params.get("segment") ?? "";
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.get("page") ?? "1", 10) || 1));
  const pageSize = Math.max(1, Math.min(50, Number.parseInt(params.get("pageSize") ?? "12", 10) || 12));
  const items = editorialProjects.filter(p => 
    (!q || [p.name,p.developer,p.area].join(" ").toLocaleLowerCase("ru").includes(q)) &&
    (!segment || p.className === segment)
  );
  return NextResponse.json({
    kind: "editorial_project_registry",
    notice: "Not an inventory feed. Prices and availability are not verified.",
    count: items.length, page, pageSize,
    results: items.slice((page-1)*pageSize, page*pageSize).map(p => ({
      ...p, pricePerSqm: null, unitsAvailable: null, lastVerifiedAt: null,
      inventoryStatus: "not_connected",
    }))
  }, {headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});
}
