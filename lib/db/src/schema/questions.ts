import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  topicId: integer("topic_id").references(() => topicsTable.id),
  addressed: boolean("addressed").default(false).notNull(),
  answer: text("answer"),
  answeredAt: timestamp("answered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable)
  .omit({ id: true, createdAt: true, addressed: true, answer: true, answeredAt: true })
  .extend({
    content: z.string().min(5),
    topicId: z.number().int().optional().nullable(),
  });

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
