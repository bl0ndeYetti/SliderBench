import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Puzzle, Activity } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { ConfigPanel } from "@/components/config-panel";
import { BatchConfig } from "@/components/batch-config";
import { StatsBar } from "@/components/stats-bar";
import { GameCard } from "@/components/game-card";
import { ConnectionStatus } from "@/components/connection-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { GameReplay } from "@/components/game-replay";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [replayData, setReplayData] = useState<RunWithGame | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    model: "all",
    sortBy: "newest",
  });

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

  const { data: initialRuns } = useQuery<AllRunsResponse>({
    queryKey: ["/api/runs"],
  });

  useEffect(() => {
    if (initialRuns && runs.length === 0 && initialRuns.runs.length > 0) {
      setRuns(initialRuns.runs);
    }
  }, [initialRuns, runs.length]);

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

  const handleStartBatch = async (configs: CreateRunRequest[]) => {
    toast({
      title: "Starting Batch",
      description: `Starting ${configs.length} benchmark runs...`,
    });

    for (const config of configs) {
      try {
        await apiRequest("POST", "/api/runs", config);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Failed to start run:", error);
      }
    }
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

  const modelOptions = useMemo(() => {
    const models = new Set(runs.map((r) => r.run.modelId));
    return Array.from(models);
  }, [runs]);

  const filteredRuns = useMemo(() => {
    let result = [...runs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.run.modelId.toLowerCase().includes(searchLower) ||
          r.run.runId.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== "all") {
      result = result.filter((r) => r.run.status === filters.status);
    }

    if (filters.model !== "all") {
      result = result.filter((r) => r.run.modelId === filters.model);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "oldest":
          return new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime();
        case "moves_asc":
          return a.game.moveCount - b.game.moveCount;
        case "moves_desc":
          return b.game.moveCount - a.game.moveCount;
        case "newest":
        default:
          return new Date(b.run.createdAt).getTime() - new Date(a.run.createdAt).getTime();
      }
    });

    return result;
  }, [runs, filters]);

  const activeRuns = filteredRuns.filter((r) => r.run.status === "in_progress");
  const completedRuns = filteredRuns.filter((r) => r.run.status !== "in_progress");

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
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-config">
            <TabsTrigger value="single">Single Run</TabsTrigger>
            <TabsTrigger value="batch">Batch Run</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <ConfigPanel
              onStartRun={handleStartRun}
              isStarting={startRunMutation.isPending}
            />
          </TabsContent>
          <TabsContent value="batch" className="mt-4">
            <BatchConfig
              onStartBatch={handleStartBatch}
              isStarting={startRunMutation.isPending}
            />
          </TabsContent>
        </Tabs>

        <StatsBar stats={stats} isLoading={statsLoading} />

        {runs.length > 0 && (
          <AnalyticsPanel runs={runs} />
        )}

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          modelOptions={modelOptions}
        />

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
                <GameCard
                  key={runData.run.runId}
                  data={runData}
                  onReplay={setReplayData}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {replayData && (
        <GameReplay data={replayData} onClose={() => setReplayData(null)} />
      )}
    </div>
  );
}
