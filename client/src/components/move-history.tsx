import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, X, AlertTriangle } from "lucide-react";
import type { MoveRecord, MoveDirection } from "@shared/schema";

interface MoveHistoryProps {
  moves: MoveRecord[];
  maxHeight?: string;
}

const directionIcons: Record<MoveDirection, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

export function MoveHistory({ moves, maxHeight = "max-h-48" }: MoveHistoryProps) {
  if (moves.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4" data-testid="move-history-empty">
        No moves yet
      </div>
    );
  }

  return (
    <ScrollArea className={`${maxHeight} pr-2`} data-testid="move-history">
      <div className="space-y-1">
        {moves.map((move, index) => {
          const Icon = move.suggestedMove ? directionIcons[move.suggestedMove] : null;
          const isError = !!move.errorType;
          const isLegal = move.isLegal;

          return (
            <div
              key={`${move.runId}-${move.moveIndex}-${index}`}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs
                ${isError ? "bg-destructive/5" : isLegal ? "bg-chart-2/5" : "bg-muted/50"}
              `}
              data-testid={`move-record-${move.moveIndex}`}
            >
              <span className="font-mono text-muted-foreground w-6">
                #{move.moveIndex + 1}
              </span>

              {Icon && (
                <div className={`
                  p-1 rounded-sm
                  ${isError ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}
                `}>
                  <Icon className="w-3 h-3" />
                </div>
              )}

              <span className="font-medium capitalize flex-1">
                {move.suggestedMove || "—"}
              </span>

              {isLegal && (
                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  Legal
                </Badge>
              )}

              {move.errorType === "illegal_move" && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs gap-0.5">
                  <X className="w-2.5 h-2.5" />
                  Illegal
                </Badge>
              )}

              {move.errorType === "parse_error" && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-xs gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Parse Error
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
