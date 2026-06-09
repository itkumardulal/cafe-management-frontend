"use client";

import { useEffect } from "react";
import { PublicMenuEmptyState } from "@/src/components/public-menu/public-menu-empty-state";

type PublicMenuErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicMenuError({ error, reset }: PublicMenuErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="public-menu-shell safe-bottom pb-10">
      <PublicMenuEmptyState variant="error" onRetry={reset} />
    </div>
  );
}
