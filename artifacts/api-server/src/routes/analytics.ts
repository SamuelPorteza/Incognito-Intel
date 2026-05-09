import { Router } from "express";
import { db, questionsTable, topicsTable } from "@workspace/db";
import { eq, sql, gte, desc } from "drizzle-orm";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/heatmap", async (req, res) => {
  try {
    const total = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(questionsTable);
    const totalCount = total[0]?.count ?? 0;

    const rows = await db
      .select({
        topicId: topicsTable.id,
        topicName: topicsTable.name,
        category: topicsTable.category,
        count: sql<number>`cast(count(${questionsTable.id}) as int)`,
      })
      .from(topicsTable)
      .leftJoin(questionsTable, eq(questionsTable.topicId, topicsTable.id))
      .groupBy(topicsTable.id, topicsTable.name, topicsTable.category)
      .orderBy(sql`count(${questionsTable.id}) desc`);

    const result = rows.map((r) => ({
      ...r,
      percentage:
        totalCount > 0 ? Math.round((r.count / totalCount) * 1000) / 10 : 0,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get heatmap");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [totalQs] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(questionsTable);

    const [totalTs] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(topicsTable);

    const [todayQs] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(questionsTable)
      .where(gte(questionsTable.createdAt, startOfToday));

    const [weekQs] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(questionsTable)
      .where(gte(questionsTable.createdAt, startOfWeek));

    const topTopicRows = await db
      .select({
        topicName: topicsTable.name,
        count: sql<number>`cast(count(${questionsTable.id}) as int)`,
      })
      .from(topicsTable)
      .leftJoin(questionsTable, eq(questionsTable.topicId, topicsTable.id))
      .groupBy(topicsTable.id, topicsTable.name)
      .orderBy(sql`count(${questionsTable.id}) desc`)
      .limit(1);

    const totalCount = totalQs?.count ?? 0;
    const top = topTopicRows[0] ?? null;

    res.json({
      totalQuestions: totalCount,
      totalTopics: totalTs?.count ?? 0,
      topTopic: top?.topicName ?? null,
      topTopicCount: top?.count ?? null,
      topTopicPercentage:
        top && totalCount > 0
          ? Math.round((top.count / totalCount) * 1000) / 10
          : null,
      questionsToday: todayQs?.count ?? 0,
      questionsThisWeek: weekQs?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recent", async (req, res) => {
  const parseResult = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { limit = 10 } = parseResult.data;

  try {
    const rows = await db
      .select({
        id: questionsTable.id,
        content: questionsTable.content,
        topicId: questionsTable.topicId,
        topicName: topicsTable.name,
        topicCategory: topicsTable.category,
        createdAt: questionsTable.createdAt,
      })
      .from(questionsTable)
      .leftJoin(topicsTable, eq(questionsTable.topicId, topicsTable.id))
      .orderBy(desc(questionsTable.createdAt))
      .limit(limit ?? 10);

    res.json(
      rows.map((r) => ({
        ...r,
        answer: (r as Record<string, unknown>).answer ?? null,
        answeredAt: ((r as Record<string, unknown>).answeredAt as Date | null)?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get recent activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

const BURST_THRESHOLD = 5;
const BURST_WINDOW_MINUTES = 10;

router.get("/alerts", async (req, res) => {
  try {
    const windowStart = new Date(Date.now() - BURST_WINDOW_MINUTES * 60 * 1000);

    const rows = await db
      .select({
        topicId: topicsTable.id,
        topicName: topicsTable.name,
        category: topicsTable.category,
        count: sql<number>`cast(count(${questionsTable.id}) as int)`,
        firstSeenAt: sql<Date>`min(${questionsTable.createdAt})`,
        lastSeenAt: sql<Date>`max(${questionsTable.createdAt})`,
      })
      .from(topicsTable)
      .innerJoin(questionsTable, eq(questionsTable.topicId, topicsTable.id))
      .where(gte(questionsTable.createdAt, windowStart))
      .groupBy(topicsTable.id, topicsTable.name, topicsTable.category)
      .having(sql`count(${questionsTable.id}) >= ${BURST_THRESHOLD}`)
      .orderBy(sql`count(${questionsTable.id}) desc`);

    res.json(
      rows.map((r) => ({
        topicId: r.topicId,
        topicName: r.topicName,
        category: r.category,
        count: r.count,
        windowMinutes: BURST_WINDOW_MINUTES,
        threshold: BURST_THRESHOLD,
        firstSeenAt: new Date(r.firstSeenAt).toISOString(),
        lastSeenAt: new Date(r.lastSeenAt).toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get burst alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
