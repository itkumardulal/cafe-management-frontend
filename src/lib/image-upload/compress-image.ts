import imageCompression from "browser-image-compression";
import { TARGET_MAX_BYTES, UPLOAD_MAX_BYTES } from "./constants";
import type { CompressionPreset } from "./compression-presets";
import { getImageFileExtension } from "./validation";
import { IMAGE_UPLOAD_MESSAGES } from "./messages";

const MAX_COMPRESSION_RETRIES = 3;

function sanitizeBaseName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "image";
  return base.replace(/\.[^.]+$/, "") || "image";
}

async function fileHasAlphaChannel(file: File): Promise<boolean> {
  if (file.type !== "image/png" && getImageFileExtension(file.name) !== "png") {
    return false;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(bitmap.width, 64);
    canvas.height = Math.min(bitmap.height, 64);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return false;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function buildCompressedFile(
  blob: Blob,
  originalName: string,
  mime: string,
): File {
  const extension =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const name = `${sanitizeBaseName(originalName)}.${extension}`;
  return new File([blob], name, { type: mime, lastModified: Date.now() });
}

export type CompressImageResult =
  | { ok: true; file: File }
  | { ok: false; error: string };

export async function compressImage(
  file: File,
  preset: CompressionPreset,
): Promise<CompressImageResult> {
  if (file.size <= UPLOAD_MAX_BYTES) {
    return { ok: true, file };
  }

  const preservePng = await fileHasAlphaChannel(file);
  const outputMime = preservePng ? "image/png" : "image/webp";

  let quality = preset.initialQuality;
  let maxWidthOrHeight = preset.maxWidthOrHeight;
  let lastBlob: Blob | null = null;

  for (let attempt = 0; attempt < MAX_COMPRESSION_RETRIES; attempt++) {
    const compressed = await imageCompression(file, {
      maxSizeMB: Math.min(preset.maxSizeMB, TARGET_MAX_BYTES / (1024 * 1024)),
      maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: false,
      initialQuality: quality,
      fileType: outputMime,
    });

    lastBlob = compressed;

    if (compressed.size <= UPLOAD_MAX_BYTES) {
      return {
        ok: true,
        file: buildCompressedFile(compressed, file.name, outputMime),
      };
    }

    quality = Math.max(preset.minQuality, quality - 0.1);
    maxWidthOrHeight = Math.max(
      preset.minWidthOrHeight,
      Math.floor(maxWidthOrHeight * 0.85),
    );
  }

  const finalSize = lastBlob?.size ?? file.size;
  return {
    ok: false,
    error: IMAGE_UPLOAD_MESSAGES.stillTooLargeAfterOptimize(finalSize),
  };
}
