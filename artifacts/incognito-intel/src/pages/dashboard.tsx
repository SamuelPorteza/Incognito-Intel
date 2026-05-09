import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { HelpCircle, Brain, Target, MessageSquare, RefreshCw, BarChart2, AlertTriangle, X, Zap } from "lucide-react";

import { 
  useGetAnalyticsSummary, 
  getGetAnalyticsSummaryQueryKey,
  useGetHeatmap, 
  getGetHeatmapQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  useGetAlerts,
  getGetAlertsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const REFRESH_INTERVAL = 30_000;

function BurstAlertBanner({ onDismissAll }: { onDismissAll: () => void }) {
  const { data: alerts } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      data-testid="burst-alert-banner"
      className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
    >
      <div className="shrink-0 mt-0.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
          {alerts.length === 1 ? "Topic Burst Detected" : `${alerts.length} Topic Bursts Detected`}
        </p>
        <div className="space-y-1.5">
          {alerts.map((alert) => (
            <div
              key={alert.topicId}
              data-testid={`alert-topic-${alert.topicId}`}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {alert.topicName}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400">
                {alert.count} questions in the last {alert.windowMinutes} min —{" "}
                {alert.count} students are stuck here right now
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
          Consider pausing the lesson to address {alerts.length === 1 ? "this topic" : "these topics"}.
        </p>
      </div>
      <button
        onClick={onDismissAll}
        className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        data-testid="button-dismiss-alerts"
        title="Dismiss alerts"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL / 1000);
  const [alertsDismissedAt, setAlertsDismissedAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("alertsDismissedAt");
    return stored ? Number(stored) : null;
  });

  const { data: summary, isLoading: loadingSummary, isFetching: fetchingSummary } = useGetAnalyticsSummary({
    query: {
      queryKey: getGetAnalyticsSummaryQueryKey(),
      refetchInterval: REFRESH_INTERVAL,
    },
  });
  const { data: heatmap, isLoading: loadingHeatmap } = useGetHeatmap({
    query: {
      queryKey: getGetHeatmapQueryKey(),
      refetchInterval: REFRESH_INTERVAL,
    },
  });
  const { data: recent, isLoading: loadingRecent } = useGetRecentActivity({ limit: 5 }, {
    query: {
      queryKey: getGetRecentActivityQueryKey({ limit: 5 }),
      refetchInterval: REFRESH_INTERVAL,
    },
  });
  const { data: allAlerts } = useGetAlerts({
    query: {
      queryKey: getGetAlertsQueryKey(),
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // Only show alerts that arrived after the last dismiss
  const activeAlerts = allAlerts?.filter((a) => {
    if (!alertsDismissedAt) return true;
    return new Date(a.lastSeenAt).getTime() > alertsDismissedAt;
  });
  const showAlerts = activeAlerts && activeAlerts.length > 0;

  function dismissAlerts() {
    const now = Date.now();
    setAlertsDismissedAt(now);
    localStorage.setItem("alertsDismissedAt", String(now));
  }

  useEffect(() => {
    if (!fetchingSummary) {
      setLastUpdated(new Date());
      setSecondsUntilRefresh(REFRESH_INTERVAL / 1000);
    }
  }, [fetchingSummary]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilRefresh((s) => (s > 1 ? s - 1 : REFRESH_INTERVAL / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif tracking-tight mb-2">Classroom Analytics</h1>
          <p className="text-muted-foreground">Real-time insights into student confusion and questions.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg shrink-0">
          <RefreshCw className={`w-3 h-3 ${fetchingSummary ? "animate-spin text-primary" : ""}`} />
          <span>
            {fetchingSummary
              ? "Refreshing..."
              : `Refreshes in ${secondsUntilRefresh}s · Last updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`}
          </span>
        </div>
      </div>

      {/* Burst alert banner */}
      {showAlerts && (
        <BurstAlertBanner onDismissAll={dismissAlerts} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`shadow-sm border-border/60 ${showAlerts ? "ring-1 ring-amber-200 dark:ring-amber-800" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalQuestions || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              +{summary?.questionsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.questionsToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Questions submitted today
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Top Struggle</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingSummary ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-xl font-bold truncate" title={summary?.topTopic || "None yet"}>
                {summary?.topTopic || "None yet"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.topTopicPercentage ? `${summary.topTopicPercentage}% of all questions` : "No data available"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Topics</CardTitle>
            <Brain className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingSummary ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalTopics || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Categories being discussed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-1 md:col-span-4 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Topic Heatmap</CardTitle>
            <CardDescription>
              Volume of questions across different classroom topics
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {loadingHeatmap ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-full mx-6" />
              </div>
            ) : heatmap && heatmap.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmap} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="topicName" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-md)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {heatmap.map((entry, index) => {
                        const isAlerting = activeAlerts?.some((a) => a.topicId === entry.topicId);
                        const colorVar = isAlerting
                          ? "38 92% 50%"
                          : entry.percentage > 25 ? "var(--chart-5)"
                          : entry.percentage > 15 ? "var(--chart-4)"
                          : entry.percentage > 10 ? "var(--chart-3)"
                          : entry.percentage > 5 ? "var(--chart-2)"
                          : "var(--chart-1)";
                        return <Cell key={`cell-${index}`} fill={`hsl(${colorVar})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground flex-col">
                <BarChart2 className="h-10 w-10 mb-2 opacity-20" />
                <p>No heatmap data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-3 shadow-sm border-border/60 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
            <CardDescription>
              The latest notes slipped under the door
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loadingRecent ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="space-y-6">
                {recent.map((question) => {
                  const isAlerting = activeAlerts?.some((a) => a.topicId === question.topicId);
                  return (
                    <div
                      key={question.id}
                      className={`flex flex-col gap-1.5 border-b border-border/50 pb-4 last:border-0 last:pb-0 ${isAlerting ? "pl-2 border-l-2 border-l-amber-400" : ""}`}
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        "{question.content}"
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {question.topicName ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isAlerting ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-secondary text-secondary-foreground"}`}>
                              {isAlerting && <AlertTriangle className="inline w-2.5 h-2.5 mr-1" />}
                              {question.topicName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium">Uncategorized</span>
                          )}
                        </div>
                        <time dateTime={question.createdAt}>
                          {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No recent questions to display
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-border mt-auto">
            <Link href="/questions" className="text-sm text-primary font-medium hover:underline block text-center">
              View all questions
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
