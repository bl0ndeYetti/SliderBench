import { Card } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, TrendingUp } from "lucide-react";
import type { StatsResponse } from "@shared/schema";

interface StatsBarProps {
  stats: StatsResponse;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

function StatCard({ icon: Icon, label, value, subValue, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-1" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </Card>
  );
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-bar">
      <StatCard
        icon={BarChart3}
        label="Total Runs"
        value={stats.totalRuns}
        subValue={`${stats.inProgressCount} active`}
        colorClass="text-chart-1"
      />
      <StatCard
        icon={CheckCircle}
        label="Success Rate"
        value={`${(stats.successRate * 100).toFixed(1)}%`}
        subValue={`${stats.solvedCount} solved`}
        colorClass="text-chart-2"
      />
      <StatCard
        icon={TrendingUp}
        label="Avg Moves"
        value={stats.averageMoves.toFixed(1)}
        subValue="moves/solve"
        colorClass="text-chart-3"
      />
      <StatCard
        icon={Clock}
        label="Avg Latency"
        value={stats.averageLatencyMs.toFixed(0)}
        subValue="ms"
        colorClass="text-chart-4"
      />
    </div>
  );
}
