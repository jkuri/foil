import { describe, expect, it } from "vitest";
import { parsePathToEditable, stringifyEditablePath } from "../path-editor-utils";

describe("lib/path-editor-utils", () => {
  describe("parsePathToEditable", () => {
    it("should parse simple Line path", () => {
      const d = "M 10 10 L 20 20";
      const points = parsePathToEditable(d);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual(expect.objectContaining({ x: 10, y: 10, start: true }));
      expect(points[1]).toEqual(expect.objectContaining({ x: 20, y: 20, start: false }));
    });

    it("should parse Cubic curve path", () => {
      const d = "M 0 0 C 10 0 10 10 20 10";
      const points = parsePathToEditable(d);

      expect(points).toHaveLength(2);
      expect(points[0].handleOut).toEqual({ x: 10, y: 0 });
      expect(points[1].handleIn).toEqual({ x: 10, y: 10 });
      expect(points[1].x).toEqual(20);
    });

    it("should normalize Q to C", () => {
      const d = "M 0 0 Q 10 10 20 0";
      const points = parsePathToEditable(d);

      expect(points).toHaveLength(2);
      expect(points[1].handleIn).toBeDefined();
      expect(points[0].handleOut).toBeDefined();
    });
  });

  describe("stringifyEditablePath", () => {
    it("should convert points back to d string", () => {
      const points = [
        { x: 0, y: 0, type: "corner" as const, start: true },
        { x: 10, y: 10, type: "corner" as const, start: false },
      ];

      const d = stringifyEditablePath(points);
      expect(d).toBe("M 0 0 L 10 10");
    });

    it("should use C command when handles are present", () => {
      const points = [
        { x: 0, y: 0, type: "corner" as const, start: true, handleOut: { x: 5, y: 0 } },
        { x: 10, y: 0, type: "corner" as const, start: false, handleIn: { x: 5, y: 0 } },
      ];

      const d = stringifyEditablePath(points);
      expect(d).toBe("M 0 0 C 5 0 5 0 10 0");
    });
  });
});
