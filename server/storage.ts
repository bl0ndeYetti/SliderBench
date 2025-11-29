import type {
  BenchmarkRun,
  GameState,
  MoveRecord,
  LLMCallRecord,
  RunWithGame,
  StatsResponse,
} from "@shared/schema";

export interface IStorage {
  getGame(gameId: string): GameState | undefined;
  setGame(game: GameState): void;

  getRun(runId: string): BenchmarkRun | undefined;
  setRun(run: BenchmarkRun): void;
  getAllRuns(): BenchmarkRun[];

  getMoves(runId: string): MoveRecord[];
  addMove(move: MoveRecord): void;

  getCallLogs(runId: string): LLMCallRecord[];
  addCallLog(log: LLMCallRecord): void;

  getRunWithGame(runId: string): RunWithGame | undefined;
  getAllRunsWithGames(): RunWithGame[];

  getStats(): StatsResponse;
}

export class MemStorage implements IStorage {
  private games: Map<string, GameState> = new Map();
  private runs: Map<string, BenchmarkRun> = new Map();
  private moveLogs: Map<string, MoveRecord[]> = new Map();
  private callLogs: Map<string, LLMCallRecord[]> = new Map();

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  setGame(game: GameState): void {
    this.games.set(game.gameId, game);
  }

  getRun(runId: string): BenchmarkRun | undefined {
    return this.runs.get(runId);
  }

  setRun(run: BenchmarkRun): void {
    this.runs.set(run.runId, run);
  }

  getAllRuns(): BenchmarkRun[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getMoves(runId: string): MoveRecord[] {
    return this.moveLogs.get(runId) || [];
  }

  addMove(move: MoveRecord): void {
    const moves = this.moveLogs.get(move.runId) || [];
    moves.push(move);
    this.moveLogs.set(move.runId, moves);
  }

  getCallLogs(runId: string): LLMCallRecord[] {
    return this.callLogs.get(runId) || [];
  }

  addCallLog(log: LLMCallRecord): void {
    const logs = this.callLogs.get(log.runId) || [];
    logs.push(log);
    this.callLogs.set(log.runId, logs);
  }

  getRunWithGame(runId: string): RunWithGame | undefined {
    const run = this.getRun(runId);
    if (!run) return undefined;

    const game = this.getGame(run.gameId);
    if (!game) return undefined;

    const moves = this.getMoves(runId);
    return { run, game, moves };
  }

  getAllRunsWithGames(): RunWithGame[] {
    const runs = this.getAllRuns();
    const result: RunWithGame[] = [];

    for (const run of runs) {
      const game = this.getGame(run.gameId);
      if (game) {
        result.push({
          run,
          game,
          moves: this.getMoves(run.runId),
        });
      }
    }

    return result;
  }

  getStats(): StatsResponse {
    const runs = this.getAllRuns();
    const solved = runs.filter((r) => r.status === "solved");
    const failed = runs.filter((r) => r.status === "failed");
    const inProgress = runs.filter((r) => r.status === "in_progress");

    let totalMoves = 0;
    let totalLatency = 0;
    let callCount = 0;

    for (const run of runs) {
      const game = this.getGame(run.gameId);
      if (game) {
        totalMoves += game.moveCount;
      }

      const logs = this.getCallLogs(run.runId);
      for (const log of logs) {
        totalLatency += log.latencyMs;
        callCount++;
      }
    }

    const completedCount = solved.length + failed.length;

    const averageMoves = completedCount > 0 ? totalMoves / completedCount : 0;
    const averageLatencyMs = callCount > 0 ? totalLatency / callCount : 0;
    const successRate = completedCount > 0 ? solved.length / completedCount : 0;

    return {
      totalRuns: runs.length,
      solvedCount: solved.length,
      failedCount: failed.length,
      inProgressCount: inProgress.length,
      averageMoves: Number.isFinite(averageMoves) ? averageMoves : 0,
      averageLatencyMs: Number.isFinite(averageLatencyMs) ? averageLatencyMs : 0,
      successRate: Number.isFinite(successRate) ? successRate : 0,
    };
  }
}

export const storage = new MemStorage();
