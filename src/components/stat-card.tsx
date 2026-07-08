import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: number; // percent
  tone?: "gold" | "success" | "danger" | "warning" | "default";
};

const toneRing: Record<NonNullable<Props["tone"]>, string> = {
  gold: "text-primary bg-primary/10 ring-primary/20",
  success: "text-[color:var(--success)] bg-[color:var(--success)]/10 ring-[color:var(--success)]/20",
  danger: "text-destructive bg-destructive/10 ring-destructive/20",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning)]/10 ring-[color:var(--warning)]/20",
  default: "text-foreground bg-muted ring-border",
};

export function StatCard({ icon: Icon, label, value, hint, trend, tone = "default" }: Props) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/5 group">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", toneRing[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {typeof trend === "number" && (
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            up ? "text-[color:var(--success)] bg-[color:var(--success)]/10" : "text-destructive bg-destructive/10"
          )}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        {hint && <div className="mt-2 text-[11px] text-muted-foreground/70">{hint}</div>}
      </div>
    </div>
  );
}
