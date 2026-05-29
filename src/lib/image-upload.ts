export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/pjpeg",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function getImageFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime && (ALLOWED_MIME_TYPES.has(mime) || mime.startsWith("image/"))) {
    return true;
  }

  return ALLOWED_EXTENSIONS.has(getImageFileExtension(file.name));
}

export const IMAGE_UPLOAD_FORMATS_HINT = "PNG, JPG, or JPEG up to 5MB";
