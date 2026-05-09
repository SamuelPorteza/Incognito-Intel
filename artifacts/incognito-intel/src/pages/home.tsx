import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Send, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useListTopics, useSubmitQuestion } from "@workspace/api-client-react";

const formSchema = z.object({
  content: z.string().min(5, "Your question should be at least 5 characters long."),
  topicId: z.string().optional().nullable(),
});

export default function Home() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const { data: topics } = useListTopics();
  const submitQuestion = useSubmitQuestion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      topicId: null,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitQuestion.mutate(
      {
        data: {
          content: values.content,
          topicId: values.topicId ? parseInt(values.topicId) : null,
        },
      },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          form.reset();
        },
        onError: () => {
          toast({
            title: "Something went wrong",
            description: "We couldn't submit your question. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.1) 0%, transparent 50%)' }} />
      
      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-4xl font-serif text-foreground tracking-tight">What's on your mind?</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            A quiet space to ask the questions you might not want to raise your hand for.
          </p>
        </div>

        {isSubmitted ? (
          <Card className="border-primary/20 bg-card/80 backdrop-blur shadow-xl animate-in zoom-in-95 duration-500">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-serif">Note passed safely</h2>
              <p className="text-muted-foreground max-w-[280px]">
                Your question has been slipped under the door. Your teacher will see it, but no one will know it was you.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => setIsSubmitted(false)}
              >
                Ask another question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur animate-in fade-in duration-700">
            <CardHeader className="pb-4">
              <div className="flex items-center text-sm text-primary font-medium bg-primary/10 w-fit px-3 py-1 rounded-full mb-2">
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                100% Anonymous
              </div>
              <CardTitle className="text-xl">Ask your question</CardTitle>
              <CardDescription>
                We strip away all identifying information. Speak freely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="I'm struggling to understand..."
                            className="min-h-[140px] resize-none text-base bg-background/50 focus:bg-background transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Topic (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder="Select a topic to help categorize" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Uncategorized</SelectItem>
                            {topics?.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full text-base h-12"
                    disabled={submitQuestion.isPending}
                  >
                    {submitQuestion.isPending ? (
                      "Folding the note..."
                    ) : (
                      <>
                        Slip it under the door
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
