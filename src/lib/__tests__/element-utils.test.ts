import { describe, expect, it } from "vitest";
import type { CanvasElement } from "@/types";
import { getElementBounds, getElementCenter, getElementTransform, getFillColor, isFillReference } from "../element-utils";

describe("element-utils", () => {
  describe("getElementTransform", () => {
    it("returns correct transform for rect", () => {
      const rect: CanvasElement = {
        id: "1",
        type: "rect",
        name: "Rect",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: Math.PI / 2,
        fill: null,
        stroke: null,
        opacity: 1,
      };
      expect(getElementTransform(rect)).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: Math.PI / 2,
      });
    });

    it("returns correct transform for line (calculated)", () => {
      const line: CanvasElement = {
        id: "1",
        type: "line",
        name: "Line",
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        rotation: 0,
        fill: null,
        stroke: null,
        opacity: 1,
      };

      const transform = getElementTransform(line);
      expect(transform.x).toBe(50);
      expect(transform.y).toBe(50);
      expect(transform.width).toBeCloseTo(141.42, 2);
      expect(transform.rotation).toBeCloseTo(Math.PI / 4, 2);
    });
  });
  describe("getElementBounds", () => {
    it("returns correct bounds for rect", () => {
      const rect: CanvasElement = {
        id: "1",
        type: "rect",
        name: "Rect",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        fill: null,
        stroke: null,
        opacity: 1,
      };
      expect(getElementBounds(rect)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    });

    it("returns correct bounds for ellipse", () => {
      const ellipse: CanvasElement = {
        id: "2",
        type: "ellipse",
        name: "Ellipse",
        cx: 100,
        cy: 100,
        rx: 50,
        ry: 25,
        rotation: 0,
        fill: null,
        stroke: null,
        opacity: 1,
      };
      expect(getElementBounds(ellipse)).toEqual({ x: 50, y: 75, width: 100, height: 50 });
    });
  });

  describe("getElementCenter", () => {
    it("returns correct center for rect", () => {
      const rect: CanvasElement = {
        id: "1",
        type: "rect",
        name: "Rect",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        fill: null,
        stroke: null,
        opacity: 1,
      };
      expect(getElementCenter(rect)).toEqual({ x: 50, y: 50 });
    });
  });

  describe("getFillColor", () => {
    it("returns fill color string", () => {
      expect(getFillColor("#ff0000")).toBe("#ff0000");
    });
    it("returns null for null fill", () => {
      expect(getFillColor(null)).toBeNull();
    });
    it("returns default color for other types", () => {
      expect(getFillColor({ ref: "grad1", type: "gradient" }, "#000000")).toBe("#000000");
    });
  });

  describe("reference checks", () => {
    it("identifies fill reference correctly", () => {
      expect(isFillReference({ ref: "grad1", type: "gradient" })).toBe(true);
      expect(isFillReference("#ff0000")).toBe(false);
      expect(isFillReference(null)).toBe(false);
    });
  });
});
