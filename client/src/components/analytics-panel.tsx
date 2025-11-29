import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Clock } from "lucide-react";
import type { RunWithGame } from "@shared/schema";

interface AnalyticsPanelProps {
  runs: RunWithGame[];
}

export function AnalyticsPanel({ runs }: AnalyticsPanelProps) {
  const modelStats = runs.reduce((acc, run) => {
    const modelName = run.run.modelId.split("/").pop() || run.run.modelId;
    if (!acc[modelName]) {
      acc[modelName] = { solved: 0, failed: 0, inProgress: 0, totalMoves: 0, count: 0 };
    }
    acc[modelName].count++;
    acc[modelName].totalMoves += run.game.moveCount;
    if (run.run.status === "solved") acc[modelName].solved++;
    else if (run.run.status === "failed") acc[modelName].failed++;
    else acc[modelName].inProgress++;
    return acc;
  }, {} as Record<string, { solved: number; failed: number; inProgress: number; totalMoves: number; count: number }>);

  const modelChartData = Object.entries(modelStats).map(([model, stats]) => ({
    name: model,
    Solved: stats.solved,
    Failed: stats.failed,
    "In Progress": stats.inProgress,
    avgMoves: stats.count > 0 ? Math.round(stats.totalMoves / stats.count) : 0,
    successRate: stats.solved + stats.failed > 0 
      ? Math.round((stats.solved / (stats.solved + stats.failed)) * 100) 
      : 0,
  }));

  const sizeStats = runs.reduce((acc, run) => {
    const size = `${run.game.size}x${run.game.size}`;
    if (!acc[size]) {
      acc[size] = { solved: 0, failed: 0, inProgress: 0, totalMoves: 0, count: 0 };
    }
    acc[size].count++;
    acc[size].totalMoves += run.game.moveCount;
    if (run.run.status === "solved") acc[size].solved++;
    else if (run.run.status === "failed") acc[size].failed++;
    else acc[size].inProgress++;
    return acc;
  }, {} as Record<string, { solved: number; failed: number; inProgress: number; totalMoves: number; count: number }>);

  const sizeChartData = Object.entries(sizeStats).map(([size, stats]) => ({
    name: size,
    Solved: stats.solved,
    Failed: stats.failed,
    avgMoves: stats.count > 0 ? Math.round(stats.totalMoves / stats.count) : 0,
  }));

  const statusData = [
    { name: "Solved", value: runs.filter((r) => r.run.status === "solved").length, color: "hsl(var(--chart-2))" },
    { name: "Failed", value: runs.filter((r) => r.run.status === "failed").length, color: "hsl(var(--chart-5))" },
    { name: "In Progress", value: runs.filter((r) => r.run.status === "in_progress").length, color: "hsl(var(--chart-1))" },
  ].filter((d) => d.value > 0);

  if (runs.length === 0) {
    return (
      <Card className="p-6" data-testid="analytics-panel">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <BarChart2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Run some benchmarks to see analytics
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="analytics-panel">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Results by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="Solved" stackId="a" fill="hsl(var(--chart-2))" />
                <Bar dataKey="Failed" stackId="a" fill="hsl(var(--chart-5))" />
                <Bar dataKey="In Progress" stackId="a" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {modelChartData.map((m) => (
              <Badge key={m.name} variant="outline" className="text-xs">
                {m.name}: {m.successRate}% success
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Results by Board Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="Solved" fill="hsl(var(--chart-2))" />
                <Bar dataKey="Failed" fill="hsl(var(--chart-5))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Average Moves by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="avgMoves" fill="hsl(var(--chart-3))" name="Avg Moves" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
