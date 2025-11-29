import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Puzzle, Activity } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { ConfigPanel } from "@/components/config-panel";
import { StatsBar } from "@/components/stats-bar";
import { GameCard } from "@/components/game-card";
import { ConnectionStatus } from "@/components/connection-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CreateRunRequest,
  AllRunsResponse,
  StatsResponse,
  WebSocketMessage,
  RunWithGame,
} from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<RunWithGame[]>([]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "run_created":
        setRuns((prev) => [message.data, ...prev]);
        break;
      case "run_updated":
        setRuns((prev) =>
          prev.map((r) =>
            r.run.runId === message.data.run.runId ? message.data : r
          )
        );
        break;
      case "run_completed":
        setRuns((prev) =>
          prev.map((r) =>
            r.run.runId === message.data.run.runId ? message.data : r
          )
        );
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        break;
      case "stats_updated":
        queryClient.setQueryData(["/api/stats"], message.data);
        break;
    }
  }, []);

  const { isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  const { isLoading: runsLoading } = useQuery<AllRunsResponse>({
    queryKey: ["/api/runs"],
    refetchOnMount: true,
  });

  useQuery<AllRunsResponse>({
    queryKey: ["/api/runs"],
    enabled: runs.length === 0,
  });

  const { data: initialRuns } = useQuery<AllRunsResponse>({
    queryKey: ["/api/runs"],
  });

  if (initialRuns && runs.length === 0 && initialRuns.runs.length > 0) {
    setRuns(initialRuns.runs);
  }

  const startRunMutation = useMutation({
    mutationFn: async (config: CreateRunRequest) => {
      const response = await apiRequest("POST", "/api/runs", config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Benchmark Started",
        description: "The AI is now solving the puzzle.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start run",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const handleStartRun = (config: CreateRunRequest) => {
    startRunMutation.mutate(config);
  };

  const stats: StatsResponse = statsData || {
    totalRuns: 0,
    solvedCount: 0,
    failedCount: 0,
    inProgressCount: 0,
    averageMoves: 0,
    averageLatencyMs: 0,
    successRate: 0,
  };

  const activeRuns = runs.filter((r) => r.run.status === "in_progress");
  const completedRuns = runs.filter((r) => r.run.status !== "in_progress");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Puzzle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none">
                  LLM Puzzle Benchmark
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sliding tile puzzle AI benchmark
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ConnectionStatus isConnected={isConnected} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <ConfigPanel
          onStartRun={handleStartRun}
          isStarting={startRunMutation.isPending}
        />

        <StatsBar stats={stats} isLoading={statsLoading} />

        {activeRuns.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-chart-1 animate-pulse" />
              <h2 className="text-lg font-semibold">
                Active Games ({activeRuns.length})
              </h2>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              data-testid="active-games-grid"
            >
              {activeRuns.map((runData) => (
                <GameCard key={runData.run.runId} data={runData} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4">
            {completedRuns.length > 0
              ? `Completed Games (${completedRuns.length})`
              : "All Games"}
          </h2>

          {runsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : completedRuns.length === 0 && activeRuns.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-testid="empty-state"
            >
              <div className="p-4 rounded-full bg-muted mb-4">
                <Puzzle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No benchmark runs yet</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Start a new benchmark run to see how different AI models perform
                at solving sliding tile puzzles.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              data-testid="completed-games-grid"
            >
              {completedRuns.map((runData) => (
                <GameCard key={runData.run.runId} data={runData} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
