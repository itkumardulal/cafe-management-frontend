"use client";

import Image from "next/image";
import { cn } from "@/src/lib/cn";

type PublicMenuImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
};

export function PublicMenuImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
  onError,
}: PublicMenuImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      sizes={sizes}
      onError={onError}
      className={cn("object-cover object-center", className)}
    />
  );
}
