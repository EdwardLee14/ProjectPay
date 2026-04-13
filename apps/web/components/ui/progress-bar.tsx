import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
  borderClassName?: string;
}

export function ProgressBar({ value, className, trackClassName, borderClassName }: ProgressBarProps) {
  const clamped = Math.min(value, 100);
  return (
    <div className={cn("h-2 w-full rounded-full overflow-hidden", trackClassName ?? "bg-off-black/10", borderClassName ?? "", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
