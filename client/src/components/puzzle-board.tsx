import { motion, AnimatePresence } from "framer-motion";
import type { Board } from "@shared/schema";

interface PuzzleBoardProps {
  board: Board;
  size: number;
  compact?: boolean;
}

export function PuzzleBoard({ board, size, compact = false }: PuzzleBoardProps) {
  const tileSize = compact ? "w-8 h-8" : "w-12 h-12";
  const fontSize = compact ? "text-xs" : "text-sm";
  const gap = compact ? "gap-0.5" : "gap-1";

  return (
    <div
      className={`grid ${gap} p-2 bg-muted/50 rounded-md`}
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      }}
      data-testid="puzzle-board"
    >
      <AnimatePresence mode="popLayout">
        {board.flat().map((tile, index) => {
          const row = Math.floor(index / size);
          const col = index % size;
          const isBlank = tile === null;

          return (
            <motion.div
              key={tile ?? "blank"}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.15,
              }}
              className={`
                ${tileSize} ${fontSize}
                flex items-center justify-center
                rounded-sm font-mono font-semibold
                transition-colors duration-150
                ${
                  isBlank
                    ? "border-2 border-dashed border-muted-foreground/30 bg-transparent"
                    : "bg-primary text-primary-foreground shadow-sm"
                }
              `}
              data-testid={`tile-${row}-${col}`}
            >
              {tile}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function SolvedBoard({ size }: { size: number }) {
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
  return <PuzzleBoard board={board} size={size} compact />;
}
