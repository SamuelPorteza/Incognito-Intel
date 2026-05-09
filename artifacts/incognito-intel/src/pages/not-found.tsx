import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-serif tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-lg">
            This note might have been misplaced. We couldn't find the page you're looking for.
          </p>
        </div>
        <div className="pt-4 flex gap-4">
          <Button asChild variant="default">
            <Link href="/">Student Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Teacher Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
