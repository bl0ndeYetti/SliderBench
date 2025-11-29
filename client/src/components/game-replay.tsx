import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { PuzzleBoard } from "./puzzle-board";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  StepBack, 
  StepForward,
  X,
  RotateCcw
} from "lucide-react";
import type { RunWithGame, Move, Board } from "@shared/schema";

interface GameReplayProps {
  data: RunWithGame;
  onClose: () => void;
}

function applyMove(board: Board, direction: string): Board {
  const size = board.length;
  const newBoard = board.map((row) => [...row]);
  
  let emptyRow = -1;
  let emptyCol = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        emptyRow = r;
        emptyCol = c;
        break;
      }
    }
    if (emptyRow !== -1) break;
  }

  let targetRow = emptyRow;
  let targetCol = emptyCol;

  switch (direction) {
    case "up":
      targetRow = emptyRow + 1;
      break;
    case "down":
      targetRow = emptyRow - 1;
      break;
    case "left":
      targetCol = emptyCol + 1;
      break;
    case "right":
      targetCol = emptyCol - 1;
      break;
  }

  if (targetRow >= 0 && targetRow < size && targetCol >= 0 && targetCol < size) {
    newBoard[emptyRow][emptyCol] = newBoard[targetRow][targetCol];
    newBoard[targetRow][targetCol] = null;
  }

  return newBoard;
}

function reconstructBoardAtStep(initialBoard: Board, moves: Move[], step: number): Board {
  let board = initialBoard.map((row) => [...row]);
  
  for (let i = 0; i < step; i++) {
    if (moves[i] && moves[i].isLegal) {
      board = applyMove(board, moves[i].direction);
    }
  }
  
  return board;
}

export function GameReplay({ data, onClose }: GameReplayProps) {
  const { game, moves } = data;
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const legalMoves = moves.filter((m) => m.isLegal);
  const maxStep = legalMoves.length;
  const currentBoard = reconstructBoardAtStep(game.initialBoard, legalMoves, currentStep);
  const currentMove = currentStep > 0 ? legalMoves[currentStep - 1] : null;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxStep) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, maxStep]);

  const togglePlay = () => {
    if (currentStep >= maxStep) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const goToStart = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const goToEnd = () => {
    setIsPlaying(false);
    setCurrentStep(maxStep);
  };

  const stepBack = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const stepForward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(maxStep, prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="game-replay-modal">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-medium">Game Replay</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-replay"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <PuzzleBoard board={currentBoard} size={game.size} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {maxStep}
              </span>
              {currentMove && (
                <Badge variant="outline" className="font-mono text-xs">
                  Move: {currentMove.direction}
                </Badge>
              )}
            </div>

            <Slider
              value={[currentStep]}
              min={0}
              max={maxStep}
              step={1}
              onValueChange={([value]) => {
                setIsPlaying(false);
                setCurrentStep(value);
              }}
              data-testid="slider-replay-step"
            />

            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToStart}
                disabled={currentStep === 0}
                data-testid="button-replay-start"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={stepBack}
                disabled={currentStep === 0}
                data-testid="button-replay-back"
              >
                <StepBack className="w-4 h-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                data-testid="button-replay-play"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={stepForward}
                disabled={currentStep >= maxStep}
                data-testid="button-replay-forward"
              >
                <StepForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToEnd}
                disabled={currentStep >= maxStep}
                data-testid="button-replay-end"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground whitespace-nowrap">Speed:</span>
              <Slider
                value={[playbackSpeed]}
                min={0.5}
                max={4}
                step={0.5}
                onValueChange={([value]) => setPlaybackSpeed(value)}
                className="flex-1"
                data-testid="slider-replay-speed"
              />
              <span className="text-xs font-mono w-12">{playbackSpeed}x</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Model:</span>{" "}
                <span className="font-medium">{data.run.modelId.split("/").pop()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Board:</span>{" "}
                <span className="font-medium">{game.size}x{game.size}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Moves:</span>{" "}
                <span className="font-medium">{maxStep}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge
                  variant={data.run.status === "solved" ? "default" : "destructive"}
                  className="text-xs h-5"
                >
                  {data.run.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
