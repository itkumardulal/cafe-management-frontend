import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  density?: "compact" | "comfortable";
};

export function Card({ className, density = "comfortable", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "surface-card",
        density === "comfortable" ? "density-comfortable" : "density-compact",
        className,
      )}
      {...props}
    />
  );
}
