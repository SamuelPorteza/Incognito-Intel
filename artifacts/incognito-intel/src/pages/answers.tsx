import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Search, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { useListQuestions, getListQuestionsQueryKey, useListTopics, getListTopicsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function AnswerCard({ question }: { question: { id: number; content: string; topicName: string | null; answer: string | null; answeredAt: string | null; createdAt: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      data-testid={`card-answer-${question.id}`}
      className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden"
    >
      <button
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        data-testid={`button-expand-answer-${question.id}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-foreground leading-relaxed line-clamp-2">
            "{question.content}"
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {question.topicName && (
              <span className="bg-secondary/50 px-2.5 py-0.5 rounded-full text-secondary-foreground font-medium flex items-center border border-border/50 text-xs">
                <Tag className="w-3 h-3 mr-1.5" />
                {question.topicName}
              </span>
            )}
            <Badge variant="default" className="text-xs px-2 py-0">Answered</Badge>
            {question.answeredAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(question.answeredAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/40 pt-4 bg-primary/5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Teacher's Answer</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{question.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Answers() {
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: topics } = useListTopics({ query: { queryKey: getListTopicsQueryKey() } });
  const { data: questions, isLoading } = useListQuestions(
    { topic: topicFilter && topicFilter !== "all" ? topicFilter : undefined, limit: 200 },
    { query: { queryKey: getListQuestionsQueryKey({ topic: topicFilter, limit: 200 }) } }
  );

  const answeredQuestions = questions?.filter((q) => !!q.answer);

  const filtered = answeredQuestions?.filter((q) =>
    search
      ? q.content.toLowerCase().includes(search.toLowerCase()) ||
        q.answer!.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen w-full pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-primary/10 rounded-full p-2">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-serif tracking-tight">Teacher Answers</h1>
          <p className="text-muted-foreground">
            Questions your teacher has responded to. You're not alone in wondering.
          </p>
          {!isLoading && (
            <p className="text-sm font-medium text-primary">
              {filtered?.length ?? 0} answered {(filtered?.length ?? 0) === 1 ? "question" : "questions"}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or answers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-answers"
            />
          </div>
          <Select
            value={topicFilter || "all"}
            onValueChange={(val) => setTopicFilter(val === "all" ? undefined : val)}
          >
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-topic-filter-answers">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics?.map((topic) => (
                <SelectItem key={topic.id} value={topic.name}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))
          ) : filtered && filtered.length > 0 ? (
            filtered.map((q) => (
              <AnswerCard
                key={q.id}
                question={{
                  id: q.id,
                  content: q.content,
                  topicName: q.topicName,
                  answer: q.answer,
                  answeredAt: q.answeredAt,
                  createdAt: q.createdAt,
                }}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No answers yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                {search || topicFilter
                  ? "Try adjusting your search or topic filter."
                  : "Your teacher hasn't answered any questions yet. Check back soon."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
