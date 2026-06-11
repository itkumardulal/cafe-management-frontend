import { describe, expect, it } from "vitest";
import { SELECT_MAX_BYTES } from "./constants";
import { validateImageFile } from "./validation";

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

describe("validateImageFile", () => {
  it("accepts allowed jpeg files within select limit", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    expect(validateImageFile(file)).toEqual({ ok: true });
  });

  it("accepts allowed webp by extension when mime is empty", () => {
    const file = makeFile("photo.webp", "", 1024);
    expect(validateImageFile(file)).toEqual({ ok: true });
  });

  it("rejects heic files with a helpful message", () => {
    const file = makeFile("photo.heic", "image/heic", 1024);
    const result = validateImageFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("HEIC");
    }
  });

  it("rejects unsupported types", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1024);
    const result = validateImageFile(file);
    expect(result.ok).toBe(false);
  });

  it("rejects files above the 15MB select limit", () => {
    const file = makeFile("large.jpg", "image/jpeg", SELECT_MAX_BYTES + 1);
    const result = validateImageFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("15MB");
    }
  });
});
