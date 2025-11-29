import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${isConnected
          ? "bg-chart-2/10 text-chart-2"
          : "bg-destructive/10 text-destructive"
        }
      `}
      data-testid="connection-status"
    >
      <div className={`relative flex items-center justify-center`}>
        {isConnected ? (
          <>
            <span className="absolute w-2 h-2 bg-chart-2 rounded-full animate-ping opacity-75" />
            <Wifi className="w-3 h-3 relative" />
          </>
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
      </div>
      <span className="hidden sm:inline">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
