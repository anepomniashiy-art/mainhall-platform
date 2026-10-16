import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    service: "mainhall-platform",
    status: "app-ready",
    database: "not-configured",
    inventory: "not-connected",
    note: "This endpoint does not claim DB or external feed connectivity."
  }, {headers:{"Cache-Control":"no-store"}});
}
