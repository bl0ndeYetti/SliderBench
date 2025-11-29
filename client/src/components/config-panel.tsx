import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Play, Settings } from "lucide-react";
import type { CreateRunRequest } from "@shared/schema";

interface ConfigPanelProps {
  onStartRun: (config: CreateRunRequest) => void;
  isStarting?: boolean;
}

const MODELS = [
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "openai/gpt-4.1", label: "GPT-4.1" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ConfigPanel({ onStartRun, isStarting }: ConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [size, setSize] = useState(3);
  const [maxMoves, setMaxMoves] = useState(100);
  const [scrambleDepth, setScrambleDepth] = useState(20);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const validatedConfig: CreateRunRequest = {
      modelId,
      size: clamp(size, 2, 6),
      maxMoves: clamp(maxMoves, 10, 500),
      scrambleDepth: clamp(scrambleDepth, 1, 200),
    };
    
    onStartRun(validatedConfig);
  };

  const handleMaxMovesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setMaxMoves(clamp(value, 10, 500));
    }
  };

  const handleScrambleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setScrambleDepth(clamp(value, 1, 200));
    }
  };

  return (
    <Card className="p-4" data-testid="config-panel">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between gap-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-toggle-config">
              <Settings className="w-4 h-4" />
              Configuration
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>

          <Button
            onClick={() => handleSubmit()}
            disabled={isStarting}
            className="gap-2"
            data-testid="button-start-run"
          >
            <Play className="w-4 h-4" />
            {isStarting ? "Starting..." : "Start New Run"}
          </Button>
        </div>

        <CollapsibleContent className="pt-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model" className="text-xs font-medium">
                Model
              </Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger id="model" data-testid="select-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size" className="text-xs font-medium">
                Board Size
              </Label>
              <Select value={size.toString()} onValueChange={(v) => setSize(parseInt(v))}>
                <SelectTrigger id="size" data-testid="select-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x2</SelectItem>
                  <SelectItem value="3">3x3</SelectItem>
                  <SelectItem value="4">4x4</SelectItem>
                  <SelectItem value="5">5x5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMoves" className="text-xs font-medium">
                Max Moves
              </Label>
              <Input
                id="maxMoves"
                type="number"
                min={10}
                max={500}
                value={maxMoves}
                onChange={handleMaxMovesChange}
                className="font-mono"
                data-testid="input-max-moves"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scrambleDepth" className="text-xs font-medium">
                Scramble Depth
              </Label>
              <Input
                id="scrambleDepth"
                type="number"
                min={1}
                max={200}
                value={scrambleDepth}
                onChange={handleScrambleDepthChange}
                className="font-mono"
                data-testid="input-scramble-depth"
              />
            </div>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
