import { beforeEach, describe, expect, it, vi } from "vitest";
import { UPLOAD_MAX_BYTES } from "./constants";
import { COMPRESSION_PRESETS } from "./compression-presets";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));

import imageCompression from "browser-image-compression";
import { compressImage } from "./compress-image";

const mockedCompression = vi.mocked(imageCompression);

function makeFile(sizeBytes: number, name = "photo.jpg", type = "image/jpeg") {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

describe("compressImage", () => {
  beforeEach(() => {
    mockedCompression.mockReset();
  });

  it("returns the original file when already within upload limit", async () => {
    const file = makeFile(1024);
    const result = await compressImage(file, COMPRESSION_PRESETS.logo);
    expect(result).toEqual({ ok: true, file });
    expect(mockedCompression).not.toHaveBeenCalled();
  });

  it("returns compressed file when compression succeeds", async () => {
    const file = makeFile(6 * 1024 * 1024);
    const compressedBlob = makeFile(1024 * 1024, "photo.webp", "image/webp");
    mockedCompression.mockResolvedValueOnce(compressedBlob);

    const result = await compressImage(file, COMPRESSION_PRESETS.document);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.size).toBeLessThanOrEqual(UPLOAD_MAX_BYTES);
      expect(result.file.name.endsWith(".webp")).toBe(true);
    }
  });

  it("fails when compressed output remains above upload limit", async () => {
    const file = makeFile(12 * 1024 * 1024);
    const stillLarge = makeFile(UPLOAD_MAX_BYTES + 1);

    mockedCompression
      .mockResolvedValueOnce(stillLarge)
      .mockResolvedValueOnce(stillLarge)
      .mockResolvedValueOnce(stillLarge);

    const result = await compressImage(file, COMPRESSION_PRESETS.document);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("still too large");
    }
  });
});
