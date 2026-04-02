import { ReactNode } from "react";

const StatCard = ({
  label,
  value,
  icon,
  trend,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: "default" | "emergency" | "stable" | "info";
}) => {
  const borderClass =
    variant === "emergency"
      ? "border-emergency/30"
      : variant === "stable"
      ? "border-stable/30"
      : variant === "info"
      ? "border-info/30"
      : "border-border";

  return (
    <div className={`rounded-xl border bg-card p-4 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold font-mono">{value}</div>
      {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
    </div>
  );
};

export default StatCard;
