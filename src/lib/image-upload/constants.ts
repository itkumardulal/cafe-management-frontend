/** Must stay aligned with backend/src/modules/uploads/upload.constants.ts */

export const SELECT_MAX_BYTES = 15 * 1024 * 1024;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const TARGET_MAX_BYTES = 4.5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/pjpeg",
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp";

export const IMAGE_UPLOAD_HINTS = {
  select: "PNG, JPG, or WebP up to 15MB — optimized automatically before upload",
  uploadLimit: "Uploaded file must be 5MB or less after optimization",
  logoRecommended: "Recommended: square logo, at least 256×256px",
  menuItemRecommended: "Recommended: at least 600×600px for menu display",
  documentRecommended: "Screenshots and receipts — text should be readable",
} as const;

/** @deprecated Use IMAGE_UPLOAD_HINTS.select */
export const IMAGE_UPLOAD_FORMATS_HINT = IMAGE_UPLOAD_HINTS.select;
