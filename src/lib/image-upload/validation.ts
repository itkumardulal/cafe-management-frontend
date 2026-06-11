import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  SELECT_MAX_BYTES,
} from "./constants";
import { IMAGE_UPLOAD_MESSAGES } from "./messages";

export function getImageFileExtension(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
  return baseName.split(".").pop()?.toLowerCase() ?? "";
}

function isHeic(file: File): boolean {
  const mime = file.type.toLowerCase();
  const ext = getImageFileExtension(file.name);
  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    ext === "heic" ||
    ext === "heif"
  );
}

export type ImageFileValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateImageFile(file: File): ImageFileValidationResult {
  if (isHeic(file)) {
    return { ok: false, error: IMAGE_UPLOAD_MESSAGES.heicUnsupported };
  }

  const mime = file.type.toLowerCase();
  const extension = getImageFileExtension(file.name);

  const mimeAllowed = mime ? ALLOWED_IMAGE_MIMES.has(mime) : false;
  const extensionAllowed = extension
    ? ALLOWED_IMAGE_EXTENSIONS.has(extension)
    : false;

  if (!mimeAllowed && !extensionAllowed) {
    return { ok: false, error: IMAGE_UPLOAD_MESSAGES.invalidType };
  }

  if (file.size > SELECT_MAX_BYTES) {
    return {
      ok: false,
      error: IMAGE_UPLOAD_MESSAGES.selectTooLarge(15),
    };
  }

  return { ok: true };
}

/** @deprecated Use validateImageFile */
export function isAllowedImageFile(file: File): boolean {
  return validateImageFile(file).ok;
}
