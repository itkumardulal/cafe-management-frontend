"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { IMAGE_UPLOAD_ACCEPT, isAllowedImageFile } from "@/src/lib/image-upload";
import { appToast } from "@/src/lib/toast";
import { api } from "@/src/services/api";

export type ImageUploadAssetType = "logo" | "module";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (url: string) => void;
  assetType: ImageUploadAssetType;
  module?: string;
  entityId?: string;
  dropTitle?: string;
  recommendedSize?: string;
  previewAlt?: string;
  uploadedLabel?: string;
  className?: string;
  required?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

export function ImageUploadField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  assetType,
  module,
  entityId,
  dropTitle = "Drag & drop image here",
  recommendedSize = "Recommended size: 512x512px (square)",
  previewAlt = "Image preview",
  uploadedLabel = "Image uploaded",
  className,
  required,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const uploadFile = async (file: File) => {
    if (!isAllowedImageFile(file)) {
      appToast.error("Please upload a PNG, JPG, or JPEG image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      appToast.error("Image size must be less than 5MB");
      return;
    }

    if (assetType === "module" && (!module || !entityId)) {
      appToast.error("Upload session is not ready. Close and reopen the form.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", assetType);
    if (assetType === "module") {
      formData.append("module", module!);
      formData.append("entityId", entityId!);
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const response = await api.post("/uploads/image", formData);
      const uploadedUrl = response.data.data.fileUrl as string;
      onChange(uploadedUrl);
      appToast.success("Image uploaded");
    } catch {
      appToast.error("Failed to upload image");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await uploadFile(file);
  };

  const clearImage = () => {
    onChange("");
  };

  return (
    <Field id={id} label={label} error={error} hint={hint} className={className} required={required}>
      <div className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => void handleDrop(event)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`cursor-pointer rounded-xl border border-dashed p-4 text-center transition ${
            isDragActive
              ? "border-primary bg-primary-soft"
              : "border-(--color-border) bg-surface-muted hover:border-primary/60"
          }`}
        >
          <p className="text-sm font-medium text-foreground">{dropTitle}</p>
          <p className="mt-1 text-xs text-muted">or click to browse files</p>
          <p className="mt-2 text-[11px] text-subtle">{recommendedSize}</p>
        </div>

        <Input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          onChange={(event) => void handleFileChange(event)}
          className="hidden"
          disabled={uploading}
        />

        {value ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2">
            <div className="inline-flex items-center gap-3">
              <img src={value} alt={previewAlt} className="h-10 w-10 rounded-md object-cover" />
              <p className="text-xs text-muted">{uploadedLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw size={14} aria-hidden="true" />
                  Replace
                </span>
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearImage} disabled={uploading}>
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </span>
              </Button>
            </div>
          </div>
        ) : null}

        {uploading ? <p className="text-xs text-muted">Uploading image...</p> : null}
      </div>
    </Field>
  );
}
