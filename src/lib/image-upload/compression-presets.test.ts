import { describe, expect, it } from "vitest";
import { resolveCompressionPreset } from "./compression-presets";

describe("resolveCompressionPreset", () => {
  it("uses logo preset for logo asset type", () => {
    expect(resolveCompressionPreset({ assetType: "logo" }).id).toBe("logo");
  });

  it("uses menu item preset for menu-items module", () => {
    expect(
      resolveCompressionPreset({ assetType: "module", module: "menu-items" }).id,
    ).toBe("menuItem");
  });

  it("uses document preset for bank transaction proofs", () => {
    expect(
      resolveCompressionPreset({
        assetType: "module",
        module: "bank-transactions",
      }).id,
    ).toBe("document");
  });

  it("uses profile preset for profile asset type", () => {
    expect(resolveCompressionPreset({ assetType: "profile" }).id).toBe(
      "profile",
    );
  });
});
