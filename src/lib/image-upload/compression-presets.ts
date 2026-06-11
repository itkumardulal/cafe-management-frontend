export type CompressionPresetId =
  | "logo"
  | "menuItem"
  | "document"
  | "profile";

export type CompressionPreset = {
  id: CompressionPresetId;
  maxWidthOrHeight: number;
  maxSizeMB: number;
  initialQuality: number;
  minQuality: number;
  minWidthOrHeight: number;
};

export const COMPRESSION_PRESETS: Record<CompressionPresetId, CompressionPreset> =
  {
    logo: {
      id: "logo",
      maxWidthOrHeight: 512,
      maxSizeMB: 0.8,
      initialQuality: 0.9,
      minQuality: 0.5,
      minWidthOrHeight: 256,
    },
    menuItem: {
      id: "menuItem",
      maxWidthOrHeight: 1200,
      maxSizeMB: 1.5,
      initialQuality: 0.85,
      minQuality: 0.5,
      minWidthOrHeight: 600,
    },
    document: {
      id: "document",
      maxWidthOrHeight: 1920,
      maxSizeMB: 4.5,
      initialQuality: 0.85,
      minQuality: 0.5,
      minWidthOrHeight: 800,
    },
    profile: {
      id: "profile",
      maxWidthOrHeight: 800,
      maxSizeMB: 1.0,
      initialQuality: 0.85,
      minQuality: 0.5,
      minWidthOrHeight: 400,
    },
  };

const DOCUMENT_MODULES = new Set([
  "bank-transactions",
  "direct-purchases",
  "raw-material-purchases",
]);

export type ResolvePresetInput = {
  assetType: "logo" | "module" | "profile";
  module?: string;
};

export function resolveCompressionPreset(
  input: ResolvePresetInput,
): CompressionPreset {
  if (input.assetType === "logo") {
    return COMPRESSION_PRESETS.logo;
  }
  if (input.assetType === "profile") {
    return COMPRESSION_PRESETS.profile;
  }
  if (input.module === "menu-items") {
    return COMPRESSION_PRESETS.menuItem;
  }
  if (input.module && DOCUMENT_MODULES.has(input.module)) {
    return COMPRESSION_PRESETS.document;
  }
  return COMPRESSION_PRESETS.document;
}
