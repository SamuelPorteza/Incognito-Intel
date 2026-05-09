import { Router } from "express";
import { db, topicsTable, questionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateTopicBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: topicsTable.id,
        name: topicsTable.name,
        category: topicsTable.category,
        questionCount: sql<number>`cast(count(${questionsTable.id}) as int)`,
      })
      .from(topicsTable)
      .leftJoin(questionsTable, eq(questionsTable.topicId, topicsTable.id))
      .groupBy(topicsTable.id, topicsTable.name, topicsTable.category)
      .orderBy(topicsTable.name);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list topics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parseResult = CreateTopicBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, category } = parseResult.data;

  try {
    const [topic] = await db
      .insert(topicsTable)
      .values({ name, category })
      .returning();

    res.status(201).json({ ...topic, questionCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create topic");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
