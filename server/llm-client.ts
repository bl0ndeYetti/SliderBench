import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Board, MoveDirection } from "@shared/schema";
import { moveResponseSchema } from "@shared/schema";

const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "";
const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL_ID || "openai/gpt-4.1-mini";

// Create OpenAI provider with custom baseURL for the gateway
const openai = createOpenAI({
  baseURL: AI_GATEWAY_BASE_URL,
  apiKey: AI_GATEWAY_API_KEY,
});

export class LLMClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMClientError";
  }
}

function serializeBoard(board: Board): string {
  return JSON.stringify(board);
}

function buildPrompt(board: Board, maxMovesRemaining: number) {
  const boardJson = serializeBoard(board);

  const systemMsg = `You are solving a sliding tile puzzle (n-puzzle). The board is a square grid with numbered tiles and one blank (null). On each turn, you may move the blank up, down, left, or right by swapping it with the adjacent tile. Your task is to choose the SINGLE next move that best progresses toward the solved state.`;

  const userMsg = `Current board (JSON):
${boardJson}

You have at most ${maxMovesRemaining} moves remaining in this run. Choose the best next move.`;

  return {
    system: systemMsg,
    prompt: userMsg,
  };
}

export interface LLMCallResult {
  requestId: string;
  parsedMove: MoveDirection | null;
  rawResponse: unknown;
  latencyMs: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export async function callLLMForMove(
  board: Board,
  modelId: string,
  maxMovesRemaining: number
): Promise<LLMCallResult> {
  if (!AI_GATEWAY_API_KEY) {
    throw new LLMClientError("AI_GATEWAY_API_KEY is not set");
  }

  const { system, prompt } = buildPrompt(board, maxMovesRemaining);
  const startTime = Date.now();

  try {
    const result = await generateObject({
      model: openai(modelId),
      schema: moveResponseSchema,
      system,
      prompt,
      temperature: 0.0,
    });

    const latencyMs = Date.now() - startTime;

    const parsedMove: MoveDirection = result.object.move;

    // Extract token usage from the result
    const usage = result.usage as {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    } | undefined;

    return {
      requestId: crypto.randomUUID(),
      parsedMove,
      rawResponse: result,
      latencyMs,
      tokenUsage: usage
        ? {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          }
        : undefined,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new LLMClientError(
      `Failed to generate object: ${errorMessage}`
    );
  }
}

export function getDefaultModelId(): string {
  return DEFAULT_MODEL_ID;
}
