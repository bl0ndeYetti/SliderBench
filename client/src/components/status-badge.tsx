import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import type { RunStatus, GameStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: RunStatus | GameStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "in_progress":
        return {
          label: "In Progress",
          variant: "secondary" as const,
          icon: Loader2,
          iconClass: "animate-spin",
          bgClass: "bg-chart-1/10 text-chart-1 border-chart-1/20",
        };
      case "solved":
        return {
          label: "Solved",
          variant: "default" as const,
          icon: CheckCircle,
          iconClass: "",
          bgClass: "bg-chart-2/10 text-chart-2 border-chart-2/20",
        };
      case "failed":
        return {
          label: "Failed",
          variant: "destructive" as const,
          icon: XCircle,
          iconClass: "",
          bgClass: "bg-destructive/10 text-destructive border-destructive/20",
        };
      case "aborted":
        return {
          label: "Aborted",
          variant: "outline" as const,
          icon: AlertCircle,
          iconClass: "",
          bgClass: "bg-muted text-muted-foreground border-muted-foreground/20",
        };
      case "error":
        return {
          label: "Error",
          variant: "destructive" as const,
          icon: AlertCircle,
          iconClass: "",
          bgClass: "bg-destructive/10 text-destructive border-destructive/20",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          icon: AlertCircle,
          iconClass: "",
          bgClass: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.bgClass} gap-1 font-medium text-xs`}
      data-testid={`status-badge-${status}`}
    >
      {showIcon && <Icon className={`w-3 h-3 ${config.iconClass}`} />}
      {config.label}
    </Badge>
  );
}
