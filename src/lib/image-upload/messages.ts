import { formatFileSize } from "./format-file-size";

export const IMAGE_UPLOAD_MESSAGES = {
  invalidType:
    "Please upload a PNG, JPG, JPEG, or WebP image",
  heicUnsupported:
    "HEIC photos are not supported. Use JPG or PNG, or enable Most Compatible photos in iPhone settings.",
  selectTooLarge: (maxMb: number) =>
    `Image must be ${maxMb}MB or less to select. Choose a smaller file.`,
  stillTooLargeAfterOptimize: (sizeBytes: number) =>
    `Image is still too large after optimization (${formatFileSize(sizeBytes)}). Try a smaller photo or lower resolution.`,
  sessionNotReady: "Upload session is not ready. Close and reopen the form.",
  uploadSuccess: "Image uploaded",
  uploadFailed: "Failed to upload image",
  optimizing: "Optimizing image…",
  uploading: (percent: number) => `Uploading… ${percent}%`,
} as const;
