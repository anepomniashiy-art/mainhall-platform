import { NextResponse } from "next/server";
import { editorialProjects } from "@/lib/editorial-projects";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    kind: "editorial_project_registry",
    notice: "Not an inventory feed. Prices and availability are not verified.",
    count: editorialProjects.length,
    results: editorialProjects.map(p => ({
      ...p, pricePerSqm: null, unitsAvailable: null, lastVerifiedAt: null,
      inventoryStatus: "not_connected",
    }))
  }, {headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});
}
