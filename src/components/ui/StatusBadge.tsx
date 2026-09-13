interface StatusBadgeProps {
  status: "connected" | "connecting" | "disconnected" | "error";
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const colors = {
    connected: "bg-safe/20 text-safe border-safe/30",
    connecting: "bg-amber-glow/20 text-amber-glow border-amber-glow/30",
    disconnected: "bg-fog/20 text-fog border-fog/30",
    error: "bg-blood/20 text-blood-bright border-blood/30",
  };

  const dots = {
    connected: "bg-safe",
    connecting: "bg-amber-glow rec-blink",
    disconnected: "bg-fog",
    error: "bg-blood-bright rec-blink",
  };

  const defaultLabels = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
    error: "Error",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 border text-xs font-mono uppercase tracking-wider ${colors[status]} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dots[status]}`} />
      {label || defaultLabels[status]}
    </div>
  );
}
