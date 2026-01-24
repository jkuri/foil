import { describe, expect, it } from "vitest";
import type { CanvasElement, EllipseElement, RectElement } from "@/types";
import { cloneElement, generateElementName, getDescendants, getElementIndex } from "../utils";

describe("store/utils", () => {
  describe("generateElementName", () => {
    it("should generate correct names for shapes", () => {
      const elements: CanvasElement[] = [];
      expect(generateElementName("rect", elements)).toBe("Rectangle 1");
      expect(generateElementName("ellipse", elements)).toBe("Ellipse 1");

      const elements2: CanvasElement[] = [
        {
          id: "1",
          type: "rect",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          fill: "red",
          opacity: 1,
          rotation: 0,
          name: "Rectangle 1",
          stroke: null,
        },
      ];
      expect(generateElementName("rect", elements2)).toBe("Rectangle 2");
    });
  });

  describe("cloneElement", () => {
    it("should clone a rect with offset", () => {
      const rect: CanvasElement = {
        id: "1",
        type: "rect",
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        fill: "red",
        opacity: 1,
        rotation: 0,
        name: "Rect",
        stroke: null,
      };
      const clone = cloneElement(rect, "2", 20) as RectElement;

      expect(clone.id).toBe("2");
      expect(clone.name).toBe("Rect Copy");
      expect(clone.x).toBe(30);
      expect(clone.y).toBe(30);
    });

    it("should clone an ellipse with offset", () => {
      const ellipse: CanvasElement = {
        id: "1",
        type: "ellipse",
        cx: 100,
        cy: 100,
        rx: 50,
        ry: 50,
        fill: "red",
        opacity: 1,
        rotation: 0,
        name: "Ellipse",
        stroke: null,
      };
      const clone = cloneElement(ellipse, "2", 10) as EllipseElement;

      expect(clone.cx).toBe(110);
      expect(clone.cy).toBe(110);
    });
  });

  describe("getDescendants", () => {
    it("should return all descendants of a group", () => {
      const c1: CanvasElement = {
        id: "c1",
        type: "rect",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        fill: "red",
        opacity: 1,
        rotation: 0,
        name: "C1",
        stroke: null,
        parentId: "g2",
      };
      const g2: CanvasElement = {
        id: "g2",
        type: "group",
        childIds: ["c1"],
        opacity: 1,
        rotation: 0,
        name: "G2",
        parentId: "g1",
      };
      const g1: CanvasElement = { id: "g1", type: "group", childIds: ["g2"], opacity: 1, rotation: 0, name: "G1" };

      const elements = [c1, g2, g1];

      const descendants = getDescendants("g1", elements);
      expect(descendants).toHaveLength(2);
      expect(descendants.map((d) => d.id)).toContain("g2");
      expect(descendants.map((d) => d.id)).toContain("c1");
    });
  });

  describe("getElementIndex", () => {
    it("should return correct index", () => {
      const el1: CanvasElement = {
        id: "1",
        type: "rect",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        fill: "red",
        opacity: 1,
        rotation: 0,
        name: "1",
        stroke: null,
      };
      const el2: CanvasElement = {
        id: "2",
        type: "rect",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        fill: "red",
        opacity: 1,
        rotation: 0,
        name: "2",
        stroke: null,
      };
      const elements = [el1, el2];

      expect(getElementIndex(elements, "1")).toBe(0);
      expect(getElementIndex(elements, "2")).toBe(1);
      expect(getElementIndex(elements, "3")).toBe(-1);
    });
  });
});
