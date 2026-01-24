import { describe, expect, it } from "vitest";
import { generateCopyName } from "../utils";

describe("generateCopyName", () => {
  it("should append 'Copy' to a name if no copies exist", () => {
    const existing = ["Rect"];
    expect(generateCopyName("Rect", existing)).toBe("Rect Copy");
  });

  it("should append 'Copy 2' if 'Copy' exists", () => {
    const existing = ["Rect", "Rect Copy"];
    expect(generateCopyName("Rect", existing)).toBe("Rect Copy 2");
  });

  it("should increment copy number if 'Copy N' exists", () => {
    const existing = ["Rect", "Rect Copy", "Rect Copy 2"];
    expect(generateCopyName("Rect", existing)).toBe("Rect Copy 3");
  });

  it("should handle gaps in numbering", () => {
    const existing = ["Rect", "Rect Copy", "Rect Copy 3"];
    expect(generateCopyName("Rect", existing)).toBe("Rect Copy 2");
  });

  it("should correctly increment if source is already a copy", () => {
    const existing = ["Rect", "Rect Copy"];

    expect(generateCopyName("Rect Copy", existing)).toBe("Rect Copy 2");
  });

  it("should correctly increment if source is 'Copy N'", () => {
    const existing = ["Rect", "Rect Copy", "Rect Copy 2"];

    expect(generateCopyName("Rect Copy 2", existing)).toBe("Rect Copy 3");
  });

  it("should handle multiple base names correctly", () => {
    const existing = ["Rect", "Rect Copy", "Oval", "Oval Copy"];
    expect(generateCopyName("Rect", existing)).toBe("Rect Copy 2");
    expect(generateCopyName("Oval", existing)).toBe("Oval Copy 2");
  });
});
