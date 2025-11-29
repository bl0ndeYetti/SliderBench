import { randomUUID } from "crypto";
import { storage } from "./storage";
import { createGame, getLegalMoves, applyMoveToGame } from "./game-engine";
import { callLLMForMove, getDefaultModelId, LLMClientError } from "./llm-client";
import type {
  BenchmarkRun,
  GameState,
  MoveRecord,
  LLMCallRecord,
  RunWithGame,
  CreateRunRequest,
} from "@shared/schema";

export interface RunConfig {
  modelId: string;
  size: number;
  maxMoves: number;
  scrambleDepth: number;
}

export function createRunConfig(request: CreateRunRequest): RunConfig {
  return {
    modelId: request.modelId || getDefaultModelId(),
    size: request.size || 4,
    maxMoves: request.maxMoves || 200,
    scrambleDepth: request.scrambleDepth || 50,
  };
}

export function initializeRun(config: RunConfig): RunWithGame {
  const game = createGame(config.size, config.scrambleDepth);
  const now = new Date().toISOString();

  const run: BenchmarkRun = {
    runId: randomUUID(),
    gameId: game.gameId,
    modelId: config.modelId,
    maxMoves: config.maxMoves,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };

  storage.setGame(game);
  storage.setRun(run);

  return { run, game, moves: [] };
}

export type StepCallback = (data: RunWithGame) => void;

export async function runSingleStep(
  runId: string,
  onUpdate?: StepCallback
): Promise<RunWithGame | null> {
  const runWithGame = storage.getRunWithGame(runId);
  if (!runWithGame) return null;

  let { run, game } = runWithGame;

  if (game.status !== "in_progress" || run.status !== "in_progress") {
    return runWithGame;
  }

  const movesRemaining = run.maxMoves - game.moveCount;
  if (movesRemaining <= 0) {
    run.status = "failed";
    run.updatedAt = new Date().toISOString();
    storage.setRun(run);
    return storage.getRunWithGame(runId)!;
  }

  let llmResult;
  try {
    llmResult = await callLLMForMove(game.currentBoard, run.modelId, movesRemaining);
  } catch (e) {
    run.status = "failed";
    run.updatedAt = new Date().toISOString();
    storage.setRun(run);

    const errorLog: LLMCallRecord = {
      requestId: randomUUID(),
      runId: run.runId,
      modelId: run.modelId,
      type: "autoMove",
      requestPayloadSummary: `LLMClientError: ${e instanceof Error ? e.message : String(e)}`,
      rawResponse: null,
      latencyMs: 0,
    };
    storage.addCallLog(errorLog);

    return storage.getRunWithGame(runId)!;
  }

  const callLog: LLMCallRecord = {
    requestId: llmResult.requestId,
    runId: run.runId,
    modelId: run.modelId,
    type: "autoMove",
    requestPayloadSummary: "auto move call",
    rawResponse: llmResult.rawResponse,
    latencyMs: llmResult.latencyMs,
    tokenUsage: llmResult.tokenUsage,
  };
  storage.addCallLog(callLog);

  const moveRecord: MoveRecord = {
    runId: run.runId,
    moveIndex: game.moveCount,
    modelId: run.modelId,
    requestId: llmResult.requestId,
    preBoard: JSON.parse(JSON.stringify(game.currentBoard)),
    suggestedMove: llmResult.parsedMove ?? undefined,
    rawSuggested: llmResult.parsedMove || undefined,
    isParsed: llmResult.parsedMove !== null,
    isLegal: false,
    timestamp: new Date().toISOString(),
  };

  if (!llmResult.parsedMove) {
    moveRecord.errorType = "parse_error";
    storage.addMove(moveRecord);
    run.status = "failed";
    run.updatedAt = new Date().toISOString();
    storage.setRun(run);
    return storage.getRunWithGame(runId)!;
  }

  const legalMoves = getLegalMoves(game.currentBoard);
  if (!legalMoves.includes(llmResult.parsedMove)) {
    moveRecord.errorType = "illegal_move";
    storage.addMove(moveRecord);
    run.status = "failed";
    run.updatedAt = new Date().toISOString();
    storage.setRun(run);
    return storage.getRunWithGame(runId)!;
  }

  const result = applyMoveToGame(game, llmResult.parsedMove);
  if (!result.success) {
    moveRecord.errorType = result.error;
    storage.addMove(moveRecord);
    run.status = "failed";
    run.updatedAt = new Date().toISOString();
    storage.setRun(run);
    storage.setGame(result.game);
    return storage.getRunWithGame(runId)!;
  }

  game = result.game;
  moveRecord.isLegal = true;
  moveRecord.postBoard = JSON.parse(JSON.stringify(game.currentBoard));
  storage.addMove(moveRecord);

  if (game.status === "solved") {
    run.status = "solved";
  }

  run.updatedAt = new Date().toISOString();
  storage.setRun(run);
  storage.setGame(game);

  const updatedData = storage.getRunWithGame(runId)!;
  if (onUpdate) {
    onUpdate(updatedData);
  }

  return updatedData;
}

export async function runToCompletion(
  runId: string,
  onUpdate?: StepCallback,
  delayMs: number = 500
): Promise<RunWithGame | null> {
  let runWithGame: RunWithGame | null = storage.getRunWithGame(runId) ?? null;
  if (!runWithGame) return null;

  while (
    runWithGame.run.status === "in_progress" &&
    runWithGame.game.status === "in_progress" &&
    runWithGame.game.moveCount < runWithGame.run.maxMoves
  ) {
    const stepResult = await runSingleStep(runId, onUpdate);
    if (!stepResult) break;
    runWithGame = stepResult;

    if (delayMs > 0 && runWithGame.run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return runWithGame;
}
