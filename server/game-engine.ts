import type { Board, MoveDirection, GameState, GameStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export function createSolvedBoard(size: number): Board {
  const board: Board = [];
  let num = 1;
  for (let i = 0; i < size; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < size; j++) {
      if (i === size - 1 && j === size - 1) {
        row.push(null);
      } else {
        row.push(num++);
      }
    }
    board.push(row);
  }
  return board;
}

export function findBlank(board: Board): [number, number] {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === null) {
        return [r, c];
      }
    }
  }
  throw new Error("Blank tile not found");
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function applyMove(board: Board, move: MoveDirection): Board {
  const size = board.length;
  const [r, c] = findBlank(board);
  let dr = 0,
    dc = 0;

  switch (move) {
    case "up":
      dr = -1;
      break;
    case "down":
      dr = 1;
      break;
    case "left":
      dc = -1;
      break;
    case "right":
      dc = 1;
      break;
  }

  const nr = r + dr;
  const nc = c + dc;

  if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
    throw new Error("Illegal move: out of bounds");
  }

  const newBoard = cloneBoard(board);
  newBoard[r][c] = newBoard[nr][nc];
  newBoard[nr][nc] = null;
  return newBoard;
}

export function getLegalMoves(board: Board): MoveDirection[] {
  const size = board.length;
  const [r, c] = findBlank(board);
  const moves: MoveDirection[] = [];

  if (r > 0) moves.push("up");
  if (r < size - 1) moves.push("down");
  if (c > 0) moves.push("left");
  if (c < size - 1) moves.push("right");

  return moves;
}

export function isValidBoard(board: Board): boolean {
  const size = board.length;
  const flat = board.flat();
  if (flat.length !== size * size) return false;
  if (flat.filter((x) => x === null).length !== 1) return false;

  const nums = flat.filter((x) => x !== null) as number[];
  const expected = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
  return nums.sort((a, b) => a - b).every((n, i) => n === expected[i]);
}

export function isSolved(board: Board): boolean {
  const size = board.length;
  const solved = createSolvedBoard(size);
  return JSON.stringify(board) === JSON.stringify(solved);
}

export function scrambleBoard(size: number, depth: number): Board {
  let board = createSolvedBoard(size);
  let lastMove: MoveDirection | null = null;

  const opposites: Record<MoveDirection, MoveDirection> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  for (let i = 0; i < depth; i++) {
    let legal = getLegalMoves(board);

    if (lastMove !== null) {
      legal = legal.filter((m) => m !== opposites[lastMove!]);
    }

    const move = legal[Math.floor(Math.random() * legal.length)];
    board = applyMove(board, move);
    lastMove = move;
  }

  return board;
}

export function createGame(size: number, scrambleDepth: number): GameState {
  const now = new Date().toISOString();
  const scrambled = scrambleBoard(size, scrambleDepth);

  return {
    gameId: randomUUID(),
    size,
    initialBoard: cloneBoard(scrambled),
    currentBoard: scrambled,
    status: "in_progress" as GameStatus,
    moveCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyMoveToGame(
  game: GameState,
  move: MoveDirection
): { success: boolean; game: GameState; error?: string } {
  if (game.status !== "in_progress") {
    return { success: false, game, error: "Game not in progress" };
  }

  const legalMoves = getLegalMoves(game.currentBoard);
  if (!legalMoves.includes(move)) {
    return { success: false, game, error: "Illegal move" };
  }

  try {
    const newBoard = applyMove(game.currentBoard, move);

    if (!isValidBoard(newBoard)) {
      game.status = "error";
      game.updatedAt = new Date().toISOString();
      return { success: false, game, error: "Invalid board state" };
    }

    game.currentBoard = newBoard;
    game.moveCount += 1;
    game.updatedAt = new Date().toISOString();

    if (isSolved(newBoard)) {
      game.status = "solved";
    }

    return { success: true, game };
  } catch (e) {
    return { success: false, game, error: String(e) };
  }
}
