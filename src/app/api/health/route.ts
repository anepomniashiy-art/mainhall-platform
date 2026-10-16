import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    service: "mainhall-platform",
    status: "app-ready",
    database: process.env.DATABASE_URL ? "configured-unverified" : "not-configured",
    inventory: "not-connected",
    note: "This endpoint does not claim DB or external feed connectivity."
  }, {headers:{"Cache-Control":"no-store"}});
}
