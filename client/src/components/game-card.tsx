import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Clock, Hash, Cpu, RotateCcw } from "lucide-react";
import { PuzzleBoard } from "./puzzle-board";
import { StatusBadge } from "./status-badge";
import { MoveHistory } from "./move-history";
import type { RunWithGame } from "@shared/schema";

interface GameCardProps {
  data: RunWithGame;
  onReplay?: (data: RunWithGame) => void;
}

export function GameCard({ data, onReplay }: GameCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { run, game, moves } = data;

  const progressPercent = Math.min((game.moveCount / run.maxMoves) * 100, 100);
  const isComplete = run.status !== "in_progress";

  const getProgressColor = () => {
    if (run.status === "solved") return "bg-chart-2";
    if (run.status === "failed") return "bg-destructive";
    if (progressPercent > 80) return "bg-destructive";
    if (progressPercent > 60) return "bg-chart-4";
    return "bg-chart-1";
  };

  const modelName = run.modelId.split("/").pop() || run.modelId;
  const shortRunId = run.runId.slice(0, 8);

  return (
    <Card
      className={`
        transition-shadow duration-200
        ${isComplete ? "opacity-90" : ""}
        ${run.status === "solved" ? "ring-1 ring-chart-2/30" : ""}
        ${run.status === "failed" ? "ring-1 ring-destructive/30" : ""}
      `}
      data-testid={`game-card-${run.runId}`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {shortRunId}
              </span>
              <StatusBadge status={run.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {modelName}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {game.size}x{game.size}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        <div className="flex justify-center">
          <PuzzleBoard board={game.currentBoard} size={game.size} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-medium">
              {game.moveCount} / {run.maxMoves} moves
            </span>
          </div>
          <Progress
            value={progressPercent}
            className="h-1.5"
            data-testid="progress-moves"
          />
        </div>

        <div className="flex items-center gap-2">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="flex-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-xs"
                data-testid="button-toggle-history"
              >
                Move History ({moves.length})
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <MoveHistory moves={moves} />
            </CollapsibleContent>
          </Collapsible>

          {isComplete && onReplay && moves.filter((m) => m.isLegal).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReplay(data)}
              className="gap-1.5 text-xs"
              data-testid={`button-replay-${run.runId}`}
            >
              <RotateCcw className="w-3 h-3" />
              Replay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
