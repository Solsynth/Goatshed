import { eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "../db/index";

export async function requireAdmin(event: any): Promise<boolean> {
  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const isAdmin = await getIsAdmin(session.user.id);
  if (!isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  return true;
}

export async function getIsAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0 && import.meta.dev) return true;
  const [record] = await db
    .select({ isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return record?.isAdmin ?? false;
}
