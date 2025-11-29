import type { Board, MoveDirection } from "@shared/schema";

const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "";
const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL_ID || "openai/gpt-4.1-mini";

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

  const systemMsg = `You are solving a sliding tile puzzle (n-puzzle). The board is a square grid with numbered tiles and one blank (null). On each turn, you may move the blank up, down, left, or right by swapping it with the adjacent tile. Your task is to choose the SINGLE next move that best progresses toward the solved state. You MUST respond in strict JSON with a single key 'move' whose value is one of: 'up', 'down', 'left', 'right'. Do not include any other text.`;

  const userMsg = `Current board (JSON):
${boardJson}

You have at most ${maxMovesRemaining} moves remaining in this run. Respond with JSON only, for example: {"move": "up"}.`;

  return {
    model: "",
    messages: [
      { role: "system" as const, content: systemMsg },
      { role: "user" as const, content: userMsg },
    ],
    temperature: 0.0,
    max_tokens: 16,
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

  const payload = buildPrompt(board, maxMovesRemaining);
  payload.model = modelId;

  const url = `${AI_GATEWAY_BASE_URL}/chat/completions`;

  const startTime = Date.now();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const text = await response.text();
    throw new LLMClientError(`Gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();

  let content: string;
  try {
    content = data.choices[0].message.content;
  } catch {
    throw new LLMClientError(`Unexpected response shape: ${JSON.stringify(data)}`);
  }

  const tokenUsage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined;

  let parsedMove: MoveDirection | null = null;
  try {
    const obj = JSON.parse(content);
    const moveStr = obj.move;
    if (["up", "down", "left", "right"].includes(moveStr)) {
      parsedMove = moveStr as MoveDirection;
    }
  } catch {
    parsedMove = null;
  }

  return {
    requestId: crypto.randomUUID(),
    parsedMove,
    rawResponse: data,
    latencyMs,
    tokenUsage,
  };
}

export function getDefaultModelId(): string {
  return DEFAULT_MODEL_ID;
}
