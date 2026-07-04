import { eq, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { mahjongSession, mahjongParticipant } from "~~/server/db/index";
import { getUserTicketBalance } from "~~/server/utils/tickets";

export default defineEventHandler(async (event) => {
  const authSession = event.context.session;
  if (!authSession) throw createError({ statusCode: 401 });

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: "Missing session ID" });

  const [ms] = await db
    .select()
    .from(mahjongSession)
    .where(eq(mahjongSession.id, sessionId))
    .limit(1);

  if (!ms) throw createError({ statusCode: 404, statusMessage: "Session not found" });
  if (ms.status !== "upcoming") throw createError({ statusCode: 400, statusMessage: "场次已开始或已结束" });

  const [existing] = await db
    .select()
    .from(mahjongParticipant)
    .where(
      and(
        eq(mahjongParticipant.sessionId, sessionId),
        eq(mahjongParticipant.userId, authSession.user.id),
      ),
    )
    .limit(1);

  if (existing) throw createError({ statusCode: 409, statusMessage: "已加入该场次" });

  const participantCount = (await db
    .select()
    .from(mahjongParticipant)
    .where(eq(mahjongParticipant.sessionId, sessionId))).length;

  if (participantCount >= ms.playerCount) {
    throw createError({ statusCode: 400, statusMessage: `场次已满（${ms.playerCount}人）` });
  }

  const balance = await getUserTicketBalance(db, authSession.user.id);

  if (balance.available < ms.multiplier) {
    throw createError({
      statusCode: 400,
      statusMessage: `票不够，需要 ${ms.multiplier} 张，你只有 ${balance.available} 张`,
    });
  }

  await db
    .insert(mahjongParticipant)
    .values({
      sessionId,
      userId: authSession.user.id,
      ticketsUsed: ms.multiplier,
    });

  return { success: true, ticketsUsed: ms.multiplier };
});
