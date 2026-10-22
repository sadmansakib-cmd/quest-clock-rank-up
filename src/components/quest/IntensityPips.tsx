import { Flame } from "lucide-react";
import { INTENSITY_LEVELS } from "@/lib/game";
import { cn } from "@/lib/utils";

export function IntensityPips({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Intensity ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Flame
          key={i}
          className={cn(
            "size-3.5 transition-colors duration-300",
            i < level ? "text-accent fill-accent/40" : "text-border",
          )}
        />
      ))}
    </span>
  );
}

const TAG_CLASSES: Record<number, string> = {
  1: "bg-tag-1/15 text-tag-1",
  2: "bg-tag-2/15 text-tag-2",
  3: "bg-tag-3/15 text-tag-3",
  4: "bg-tag-4/15 text-tag-4",
  5: "bg-tag-5/15 text-tag-5",
};

export const TAG_DOT: Record<number, string> = {
  1: "bg-tag-1",
  2: "bg-tag-2",
  3: "bg-tag-3",
  4: "bg-tag-4",
  5: "bg-tag-5",
};

/** Small colored pill showing the intensity label, like a category tag. */
export function IntensityTag({ level, className }: { level: number; className?: string }) {
  const label = INTENSITY_LEVELS.find((l) => l.level === level)?.label ?? "";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        TAG_CLASSES[level],
        className,
      )}
    >
      {label}
    </span>
  );
}
