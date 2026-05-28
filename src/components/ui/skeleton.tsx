import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-xl", className)} {...props} />;
}
