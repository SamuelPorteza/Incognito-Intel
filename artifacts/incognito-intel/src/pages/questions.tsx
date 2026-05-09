import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Filter, Search, MessageCircleQuestion, Plus, Tag, CheckCircle2, Circle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useListQuestions,
  getListQuestionsQueryKey,
  useListTopics,
  useGetQuestion,
  getGetQuestionQueryKey,
  useCreateTopic,
  getListTopicsQueryKey,
  useUpdateQuestion,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const topicSchema = z.object({
  name: z.string().min(2, "Topic name must be at least 2 characters."),
  category: z.string().min(2, "Category must be at least 2 characters."),
});

function QuestionDetailDialog({
  questionId,
  open,
  onOpenChange,
}: {
  questionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: question, isLoading } = useGetQuestion(questionId || 0, {
    query: { enabled: !!questionId, queryKey: getGetQuestionQueryKey(questionId || 0) },
  });
  const updateQuestion = useUpdateQuestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function toggleAddressed() {
    if (!question) return;
    updateQuestion.mutate(
      { id: question.id, data: { addressed: !question.addressed } },
      {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(question.id) });
          toast({
            title: updated.addressed ? "Marked as addressed" : "Marked as unaddressed",
            description: updated.addressed
              ? "This question has been marked as covered in class."
              : "This question has been reopened.",
          });
        },
        onError: () => {
          toast({ title: "Failed to update question", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Question Detail</DialogTitle>
          <DialogDescription>
            {question && format(new Date(question.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : question ? (
            <div className="space-y-6">
              <p className="text-lg text-foreground font-medium leading-relaxed bg-accent/30 p-4 rounded-md">
                "{question.content}"
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Topic</h4>
                  <p className="text-sm font-medium">{question.topicName || "Uncategorized"}</p>
                </div>
                {question.topicCategory && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category</h4>
                    <p className="text-sm font-medium">{question.topicCategory}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Question ID</h4>
                  <p className="text-sm font-medium">#{question.id}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                  <Badge variant={question.addressed ? "default" : "secondary"} className="text-xs">
                    {question.addressed ? "Addressed" : "Pending"}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={toggleAddressed}
                disabled={updateQuestion.isPending}
                variant={question.addressed ? "outline" : "default"}
                className="w-full"
                data-testid="button-toggle-addressed"
              >
                {updateQuestion.isPending ? (
                  "Saving..."
                ) : question.addressed ? (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Mark as Not Addressed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Addressed
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Questions() {
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "addressed">("all");
  const [search, setSearch] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics } = useListTopics({ query: { queryKey: getListTopicsQueryKey() } });
  const { data: questions, isLoading } = useListQuestions(
    { topic: topicFilter && topicFilter !== "all" ? topicFilter : undefined },
    { query: { queryKey: getListQuestionsQueryKey({ topic: topicFilter }) } }
  );

  const updateQuestion = useUpdateQuestion();
  const createTopic = useCreateTopic();

  const form = useForm<z.infer<typeof topicSchema>>({
    resolver: zodResolver(topicSchema),
    defaultValues: { name: "", category: "General" },
  });

  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch = search ? q.content.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "addressed"
        ? q.addressed
        : !q.addressed;
    return matchesSearch && matchesStatus;
  });

  const addressedCount = questions?.filter((q) => q.addressed).length ?? 0;
  const pendingCount = questions?.filter((q) => !q.addressed).length ?? 0;

  function handleToggleAddressed(e: React.MouseEvent, questionId: number, currentAddressed: boolean) {
    e.stopPropagation();
    updateQuestion.mutate(
      { id: questionId, data: { addressed: !currentAddressed } },
      {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
          toast({
            title: updated.addressed ? "Marked as addressed" : "Marked as unaddressed",
          });
        },
        onError: () => {
          toast({ title: "Failed to update question", variant: "destructive" });
        },
      }
    );
  }

  function onSubmitTopic(values: z.infer<typeof topicSchema>) {
    createTopic.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Topic created", description: "The new topic has been added successfully." });
          setTopicDialogOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to create topic", description: "There was an error creating the topic.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      <QuestionDetailDialog
        questionId={selectedQuestionId}
        open={!!selectedQuestionId}
        onOpenChange={(open) => !open && setSelectedQuestionId(null)}
      />

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight mb-2">All Questions</h1>
          <p className="text-muted-foreground">Every anonymous question submitted by students.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Circle className="w-3.5 h-3.5" />
                {pendingCount} pending
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {addressedCount} addressed
              </span>
            </div>
          )}
          <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-new-topic">
                <Plus className="w-4 h-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>Add a new topic to help categorize student questions.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitTopic)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Photosynthesis" {...field} data-testid="input-topic-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Biology" {...field} data-testid="input-topic-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createTopic.isPending} data-testid="button-submit-topic">
                      {createTopic.isPending ? "Creating..." : "Create Topic"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-lg border border-border/60 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="pl-9 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
          <Select
            value={topicFilter || "all"}
            onValueChange={(val) => setTopicFilter(val === "all" ? undefined : val)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50" data-testid="select-topic-filter">
              <SelectValue placeholder="Filter by topic" />
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

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "all" | "pending" | "addressed")}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background/50" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="addressed">Addressed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))
        ) : filteredQuestions && filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Card
              key={question.id}
              data-testid={`card-question-${question.id}`}
              className={`border-border/60 shadow-sm hover:shadow-md transition-all group cursor-pointer ${
                question.addressed ? "opacity-60 bg-muted/30" : ""
              }`}
              onClick={() => setSelectedQuestionId(question.id)}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <button
                  data-testid={`button-addressed-${question.id}`}
                  onClick={(e) => handleToggleAddressed(e, question.id, question.addressed)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  title={question.addressed ? "Mark as not addressed" : "Mark as addressed"}
                >
                  {question.addressed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-medium mb-3 leading-relaxed line-clamp-2 ${
                      question.addressed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    "{question.content}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {question.topicName && (
                      <div className="bg-secondary/50 px-2.5 py-0.5 rounded-full text-secondary-foreground font-medium flex items-center border border-border/50 text-xs">
                        <Tag className="w-3 h-3 mr-1.5" />
                        {question.topicName}
                      </div>
                    )}
                    {question.addressed && (
                      <Badge variant="default" className="text-xs px-2 py-0">
                        Addressed
                      </Badge>
                    )}
                    <time dateTime={question.createdAt} className="text-xs">
                      {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed border-border">
            <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <MessageCircleQuestion className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No questions found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {search || topicFilter || statusFilter !== "all"
                ? "Try adjusting your filters or search terms to find what you're looking for."
                : "It's quiet in here. Share the link with your students so they can start asking."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
