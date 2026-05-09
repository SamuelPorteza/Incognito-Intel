import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2, MessageCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, useGetAlerts, getGetAlertsQueryKey } from "@workspace/api-client-react";

const REFRESH_INTERVAL = 30_000;

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  const isTeacher = location.startsWith("/dashboard") || location.startsWith("/questions");

  const { data: allAlerts } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: REFRESH_INTERVAL,
      enabled: isTeacher,
    },
  });

  const dismissedAt =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("alertsDismissedAt") ?? "0")
      : 0;

  const activeAlertCount =
    allAlerts?.filter((a) => {
      if (!dismissedAt) return true;
      return new Date(a.lastSeenAt).getTime() > dismissedAt;
    }).length ?? 0;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {isTeacher ? (
        <aside className="flex w-full flex-col border-r border-border bg-card md:w-64 md:shrink-0">
          <div className="flex h-16 items-center px-6 border-b border-border">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight text-foreground">Incognito Intel</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location === "/dashboard"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <BarChart2 className="h-4 w-4 shrink-0" />
              <span className="flex-1">Analytics</span>
              {activeAlertCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold leading-none animate-pulse">
                  {activeAlertCount}
                </span>
              )}
            </Link>
            <Link
              href="/questions"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location === "/questions"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              All Questions
            </Link>
          </nav>
          <div className="p-4 mt-auto border-t border-border/50">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground mb-4"
            >
              Student View
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span>System: {health?.status === "ok" ? "Online" : "Checking..."}</span>
            </div>
          </div>
        </aside>
      ) : (
        <header className="absolute top-0 w-full flex h-16 items-center justify-between px-6 z-10">
          <div className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight text-foreground">Incognito Intel</span>
          </div>
          <nav className="flex items-center gap-5">
            <Link
              href="/answers"
              className={cn(
                "text-sm font-medium transition-colors",
                location === "/answers" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              data-testid="link-answers"
            >
              See Answers
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-teacher-portal"
            >
              Teacher Portal
            </Link>
          </nav>
        </header>
      )}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
