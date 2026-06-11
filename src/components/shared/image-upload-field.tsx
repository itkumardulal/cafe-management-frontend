"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { useImageUpload } from "@/src/hooks/use-image-upload";
import { cn } from "@/src/lib/cn";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_HINTS,
  resolveCompressionPreset,
} from "@/src/lib/image-upload";
import { IMAGE_UPLOAD_MESSAGES } from "@/src/lib/image-upload/messages";
import type { UploadImageAssetType } from "@/src/lib/image-upload/upload-image.service";
import { appToast } from "@/src/lib/toast";

export type ImageUploadAssetType = UploadImageAssetType;

export type ImageUploadFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (url: string) => void;
  assetType: ImageUploadAssetType;
  module?: string;
  entityId?: string;
  userId?: string;
  cafeId?: string;
  dropTitle?: string;
  recommendedSize?: string;
  previewAlt?: string;
  uploadedLabel?: string;
  className?: string;
  required?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

function defaultRecommendedSize(
  assetType: ImageUploadAssetType,
  module?: string,
): string {
  const preset = resolveCompressionPreset({ assetType, module });
  if (preset.id === "logo") {
    return IMAGE_UPLOAD_HINTS.logoRecommended;
  }
  if (preset.id === "menuItem") {
    return IMAGE_UPLOAD_HINTS.menuItemRecommended;
  }
  return IMAGE_UPLOAD_HINTS.documentRecommended;
}

export function ImageUploadField({
  id,
  label,
  hint = IMAGE_UPLOAD_HINTS.select,
  error,
  value,
  onChange,
  assetType,
  module,
  entityId,
  userId,
  cafeId,
  dropTitle = "Drag & drop image here",
  recommendedSize,
  previewAlt = "Image preview",
  uploadedLabel = "Image uploaded",
  className,
  required,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    status,
    uploadProgress,
    localPreviewUrl,
    errorMessage,
    isBusy,
    processFile,
    retry,
    reset,
  } = useImageUpload({
    assetType,
    module,
    entityId,
    userId,
    cafeId,
    onUploadingChange,
    onSuccess: (url) => {
      onChange(url);
      appToast.success(IMAGE_UPLOAD_MESSAGES.uploadSuccess);
    },
  });

  const resolvedRecommendedSize =
    recommendedSize ?? defaultRecommendedSize(assetType, module);

  const previewSrc = value || localPreviewUrl || "";
  const showPreview = Boolean(previewSrc);

  const handleFile = async (file: File) => {
    await processFile(file);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await handleFile(file);
  };

  const clearImage = () => {
    reset();
    onChange("");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const statusMessage =
    status === "compressing"
      ? IMAGE_UPLOAD_MESSAGES.optimizing
      : status === "uploading"
        ? IMAGE_UPLOAD_MESSAGES.uploading(uploadProgress)
        : null;

  const displayError = error ?? errorMessage ?? undefined;

  return (
    <Field
      id={id}
      label={label}
      error={displayError}
      hint={hint}
      className={className}
      required={required}
    >
      <div className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          aria-label={`${dropTitle}. ${resolvedRecommendedSize}`}
          onClick={openFilePicker}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => void handleDrop(event)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          className={cn(
            "touch-target flex w-full min-h-[7rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition",
            isDragActive
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-primary)]/60",
          )}
        >
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            {dropTitle}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            or tap to browse files
          </p>
          <p className="mt-2 text-[11px] text-[var(--color-subtle)]">
            {resolvedRecommendedSize}
          </p>
        </div>

        <Input
          ref={fileInputRef}
          id={`${id}-file`}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          onChange={(event) => void handleFileChange(event)}
          className="hidden"
          disabled={isBusy}
          aria-hidden
          tabIndex={-1}
        />

        {showPreview ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex min-w-0 items-center gap-3">
              <img
                src={previewSrc}
                alt={previewAlt}
                loading="lazy"
                className="h-12 w-12 shrink-0 rounded-md object-cover"
              />
              <p className="truncate text-xs text-[var(--color-muted)]">
                {value ? uploadedLabel : "Preview — uploading soon"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="min-h-11 flex-1 sm:flex-none"
                onClick={openFilePicker}
                disabled={isBusy}
              >
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw size={14} aria-hidden="true" />
                  Replace
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-11 flex-1 sm:flex-none"
                onClick={clearImage}
                disabled={isBusy}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </span>
              </Button>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <div className="space-y-1.5" role="status" aria-live="polite">
            <p className="text-xs text-[var(--color-muted)]">{statusMessage}</p>
            {status === "uploading" ? (
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            ) : (
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
                aria-hidden
              >
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--color-primary)]" />
              </div>
            )}
          </div>
        ) : null}

        {status === "error" && errorMessage ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void retry()}
            disabled={isBusy}
          >
            Retry upload
          </Button>
        ) : null}
      </div>
    </Field>
  );
}
