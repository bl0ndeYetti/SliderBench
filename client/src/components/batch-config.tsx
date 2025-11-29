import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronDown, Play, Layers } from "lucide-react";
import type { CreateRunRequest } from "@shared/schema";

interface BatchConfigProps {
  onStartBatch: (configs: CreateRunRequest[]) => void;
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

export function BatchConfig({ onStartBatch, isStarting }: BatchConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([MODELS[0].id]);
  const [sizes, setSizes] = useState<number[]>([3]);
  const [maxMoves, setMaxMoves] = useState(100);
  const [scrambleDepth, setScrambleDepth] = useState(20);
  const [runsPerConfig, setRunsPerConfig] = useState(1);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const configs: CreateRunRequest[] = [];
    
    for (const modelId of selectedModels) {
      for (const size of sizes) {
        for (let i = 0; i < runsPerConfig; i++) {
          configs.push({
            modelId,
            size: clamp(size, 2, 6),
            maxMoves: clamp(maxMoves, 10, 500),
            scrambleDepth: clamp(scrambleDepth, 1, 200),
          });
        }
      }
    }
    
    onStartBatch(configs);
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      return [...prev, modelId];
    });
  };

  const toggleSize = (size: number) => {
    setSizes((prev) => {
      if (prev.includes(size)) {
        return prev.filter((s) => s !== size);
      }
      return [...prev, size];
    });
  };

  const totalRuns = selectedModels.length * sizes.length * runsPerConfig;

  return (
    <Card className="p-4" data-testid="batch-config">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between gap-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-toggle-batch">
              <Layers className="w-4 h-4" />
              Batch Configuration
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>

          <Button
            onClick={() => handleSubmit()}
            disabled={isStarting || totalRuns === 0}
            className="gap-2"
            data-testid="button-start-batch"
          >
            <Play className="w-4 h-4" />
            {isStarting ? "Starting..." : `Start Batch (${totalRuns} runs)`}
          </Button>
        </div>

        <CollapsibleContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Select Models</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MODELS.map((model) => (
                  <div key={model.id} className="flex items-center gap-2">
                    <Checkbox
                      id={model.id}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                      data-testid={`checkbox-model-${model.id}`}
                    />
                    <Label htmlFor={model.id} className="text-sm cursor-pointer">
                      {model.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Select Board Sizes</Label>
              <div className="flex gap-4">
                {[2, 3, 4, 5].map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={sizes.includes(size)}
                      onCheckedChange={() => toggleSize(size)}
                      data-testid={`checkbox-size-${size}`}
                    />
                    <Label htmlFor={`size-${size}`} className="text-sm cursor-pointer">
                      {size}x{size}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-maxMoves" className="text-xs font-medium">
                  Max Moves
                </Label>
                <Input
                  id="batch-maxMoves"
                  type="number"
                  min={10}
                  max={500}
                  value={maxMoves}
                  onChange={(e) => setMaxMoves(clamp(parseInt(e.target.value) || 100, 10, 500))}
                  className="font-mono"
                  data-testid="input-batch-max-moves"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-scrambleDepth" className="text-xs font-medium">
                  Scramble Depth
                </Label>
                <Input
                  id="batch-scrambleDepth"
                  type="number"
                  min={1}
                  max={200}
                  value={scrambleDepth}
                  onChange={(e) => setScrambleDepth(clamp(parseInt(e.target.value) || 20, 1, 200))}
                  className="font-mono"
                  data-testid="input-batch-scramble-depth"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="runsPerConfig" className="text-xs font-medium">
                  Runs Per Config
                </Label>
                <Input
                  id="runsPerConfig"
                  type="number"
                  min={1}
                  max={10}
                  value={runsPerConfig}
                  onChange={(e) => setRunsPerConfig(clamp(parseInt(e.target.value) || 1, 1, 10))}
                  className="font-mono"
                  data-testid="input-runs-per-config"
                />
              </div>
            </div>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
