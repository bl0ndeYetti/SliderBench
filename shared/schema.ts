import { z } from "zod";

export type Board = (number | null)[][];

export const MoveDirection = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
} as const;
export type MoveDirection = (typeof MoveDirection)[keyof typeof MoveDirection];

export const GameStatus = {
  in_progress: "in_progress",
  solved: "solved",
  error: "error",
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const RunStatus = {
  in_progress: "in_progress",
  solved: "solved",
  failed: "failed",
  aborted: "aborted",
} as const;
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export interface GameState {
  gameId: string;
  size: number;
  initialBoard: Board;
  currentBoard: Board;
  status: GameStatus;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkRun {
  runId: string;
  gameId: string;
  modelId: string;
  maxMoves: number;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MoveRecord {
  runId: string;
  moveIndex: number;
  modelId: string;
  requestId?: string;
  preBoard: Board;
  suggestedMove?: MoveDirection;
  rawSuggested?: string;
  isParsed: boolean;
  isLegal: boolean;
  postBoard?: Board;
  errorType?: string;
  timestamp: string;
}

export interface LLMCallRecord {
  requestId: string;
  runId: string;
  modelId: string;
  type: "autoMove";
  requestPayloadSummary: string;
  rawResponse: unknown;
  latencyMs: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface RunSummary {
  runId: string;
  modelId: string;
  size: number;
  initialBoard: Board;
  finalBoard: Board;
  status: RunStatus;
  totalMoves: number;
  illegalMoveCount: number;
  parseErrorCount: number;
  averageLatencyMs: number;
  totalTokens: number;
}

export interface RunWithGame {
  run: BenchmarkRun;
  game: GameState;
  moves: MoveRecord[];
}

export const createRunRequestSchema = z.object({
  modelId: z.string().optional(),
  size: z.number().min(2).max(6).default(4),
  maxMoves: z.number().min(10).max(500).default(200),
  scrambleDepth: z.number().min(1).max(200).default(50),
});

export type CreateRunRequest = z.infer<typeof createRunRequestSchema>;

export interface CreateRunResponse {
  run: BenchmarkRun;
  game: GameState;
}

export interface GetRunResponse {
  run: BenchmarkRun;
  game: GameState;
  lastMoves: MoveRecord[];
}

export interface StepRunResponse extends GetRunResponse {}

export interface AllRunsResponse {
  runs: RunWithGame[];
}

export interface StatsResponse {
  totalRuns: number;
  solvedCount: number;
  failedCount: number;
  inProgressCount: number;
  averageMoves: number;
  averageLatencyMs: number;
  successRate: number;
}

export type WebSocketMessage =
  | { type: "run_created"; data: RunWithGame }
  | { type: "run_updated"; data: RunWithGame }
  | { type: "run_completed"; data: RunWithGame }
  | { type: "stats_updated"; data: StatsResponse };

// Schema for LLM move response
export const moveResponseSchema = z.object({
  move: z.enum(["up", "down", "left", "right"]),
});

export type MoveResponse = z.infer<typeof moveResponseSchema>;
