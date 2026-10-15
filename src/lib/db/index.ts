/**
 * Prisma client singleton.
 *
 * Prisma ORM 8.x changed the CLI — `prisma generate` no longer exists.
 * The client is generated via `prisma orm generate` or at `prisma dev` time.
 * Until the database is connected and the client is generated, this module
 * exports a placeholder that throws on use.
 */

let PrismaClientClass: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PrismaClientClass = require("@prisma/client").PrismaClient;
} catch {
  // Client not yet generated — provide a lazy placeholder
  PrismaClientClass = null;
}

function getClient() {
  if (!PrismaClientClass) {
    throw new Error(
      "Prisma client is not generated yet. Run `npx prisma orm generate` after connecting a database."
    );
  }
  const globalForPrisma = globalThis as unknown as { prisma: any };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClientClass({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

/** Lazy Prisma client — resolves on first access */
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    return getClient()[prop];
  },
});
