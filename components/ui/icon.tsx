import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

export function Icon({ name, className, filled, size }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        fontSize: size,
      }}
    >
      {name}
    </span>
  );
}
