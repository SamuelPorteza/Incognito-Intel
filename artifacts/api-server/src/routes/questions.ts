import { Router } from "express";
import { db, questionsTable, topicsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  SubmitQuestionBody,
  ListQuestionsQueryParams,
  GetQuestionParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parseResult = ListQuestionsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { topic, limit = 50, offset = 0 } = parseResult.data;

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
      .where(topic ? eq(topicsTable.name, topic) : undefined)
      .orderBy(desc(questionsTable.createdAt))
      .limit(limit ?? 50)
      .offset(offset ?? 0);

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list questions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parseResult = SubmitQuestionBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content, topicId } = parseResult.data;

  try {
    const [question] = await db
      .insert(questionsTable)
      .values({ content, topicId: topicId ?? null })
      .returning();

    let topicName: string | null = null;
    let topicCategory: string | null = null;

    if (question.topicId) {
      const topic = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.id, question.topicId))
        .limit(1);
      if (topic[0]) {
        topicName = topic[0].name;
        topicCategory = topic[0].category;
      }
    }

    res.status(201).json({
      ...question,
      topicName,
      topicCategory,
      createdAt: question.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit question");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const parseResult = GetQuestionParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parseResult.data;

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
      .where(eq(questionsTable.id, id))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    res.json({
      ...rows[0],
      createdAt: rows[0].createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get question");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
