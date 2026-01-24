import { beforeEach, describe, expect, it } from "vitest";
import {
  buildDragElementsMap,
  collectDraggableElements,
  collectElementsForResize,
  collectElementsForRotation,
  flattenCanvasElements,
  getDescendantIds,
} from "../element-helpers";
import {
  createEllipse,
  createGetElementById,
  createGroup,
  createLine,
  createPath,
  createRect,
  createText,
  resetIdCounter,
} from "./test-utils";

beforeEach(() => {
  resetIdCounter();
});

describe("flattenCanvasElements", () => {
  it("should return elements as-is when no groups", () => {
    const rect = createRect();
    const ellipse = createEllipse();
    const elements = [rect, ellipse];
    const getElementById = createGetElementById(elements);

    const result = flattenCanvasElements(elements, getElementById);

    expect(result).toHaveLength(2);
    expect(result).toContain(rect);
    expect(result).toContain(ellipse);
  });

  it("should flatten a single group into its children", () => {
    const rect = createRect();
    const ellipse = createEllipse();
    const group = createGroup([rect, ellipse]);
    const elements = [rect, ellipse, group];
    const getElementById = createGetElementById(elements);

    const result = flattenCanvasElements([group], getElementById);

    expect(result).toHaveLength(2);
    expect(result).toContain(rect);
    expect(result).toContain(ellipse);
    expect(result.find((e) => e.type === "group")).toBeUndefined();
  });

  it("should flatten nested groups", () => {
    const rect1 = createRect();
    const rect2 = createRect();
    const innerGroup = createGroup([rect2]);
    const outerGroup = createGroup([rect1, innerGroup]);
    const elements = [rect1, rect2, innerGroup, outerGroup];
    const getElementById = createGetElementById(elements);

    const result = flattenCanvasElements([outerGroup], getElementById);

    expect(result).toHaveLength(2);
    expect(result).toContain(rect1);
    expect(result).toContain(rect2);
  });

  it("should handle empty input", () => {
    const getElementById = createGetElementById([]);
    const result = flattenCanvasElements([], getElementById);
    expect(result).toHaveLength(0);
  });

  it("should handle deeply nested groups", () => {
    const rect = createRect();
    const group1 = createGroup([rect]);
    const group2 = createGroup([group1]);
    const group3 = createGroup([group2]);
    const elements = [rect, group1, group2, group3];
    const getElementById = createGetElementById(elements);

    const result = flattenCanvasElements([group3], getElementById);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(rect);
  });
});

describe("getDescendantIds", () => {
  it("should return single element id", () => {
    const rect = createRect();
    const getElementById = createGetElementById([rect]);

    const result = getDescendantIds([rect.id], getElementById);

    expect(result.size).toBe(1);
    expect(result.has(rect.id)).toBe(true);
  });

  it("should include group and all its children", () => {
    const rect = createRect();
    const ellipse = createEllipse();
    const group = createGroup([rect, ellipse]);
    const elements = [rect, ellipse, group];
    const getElementById = createGetElementById(elements);

    const result = getDescendantIds([group.id], getElementById);

    expect(result.size).toBe(3);
    expect(result.has(group.id)).toBe(true);
    expect(result.has(rect.id)).toBe(true);
    expect(result.has(ellipse.id)).toBe(true);
  });

  it("should handle nested groups", () => {
    const rect = createRect();
    const innerGroup = createGroup([rect]);
    const outerGroup = createGroup([innerGroup]);
    const elements = [rect, innerGroup, outerGroup];
    const getElementById = createGetElementById(elements);

    const result = getDescendantIds([outerGroup.id], getElementById);

    expect(result.size).toBe(3);
    expect(result.has(outerGroup.id)).toBe(true);
    expect(result.has(innerGroup.id)).toBe(true);
    expect(result.has(rect.id)).toBe(true);
  });

  it("should handle multiple root elements", () => {
    const rect1 = createRect();
    const rect2 = createRect();
    const getElementById = createGetElementById([rect1, rect2]);

    const result = getDescendantIds([rect1.id, rect2.id], getElementById);

    expect(result.size).toBe(2);
  });
});

describe("collectElementsForResize", () => {
  it("should collect rect element data", () => {
    const rect = createRect({ x: 10, y: 20, width: 100, height: 50, rotation: 0.5 });
    const map = new Map();
    const getElementById = createGetElementById([rect]);

    collectElementsForResize([rect], map, getElementById);

    expect(map.size).toBe(1);
    const data = map.get(rect.id);
    expect(data.x).toBe(10);
    expect(data.y).toBe(20);
    expect(data.width).toBe(100);
    expect(data.height).toBe(50);
    expect(data.rotation).toBe(0.5);
    expect(data.type).toBe("rect");
  });

  it("should collect ellipse element data with cx, cy, rx, ry", () => {
    const ellipse = createEllipse({ cx: 100, cy: 200, rx: 50, ry: 30 });
    const map = new Map();
    const getElementById = createGetElementById([ellipse]);

    collectElementsForResize([ellipse], map, getElementById);

    const data = map.get(ellipse.id);
    expect(data.cx).toBe(100);
    expect(data.cy).toBe(200);
    expect(data.rx).toBe(50);
    expect(data.ry).toBe(30);
  });

  it("should collect line element data with endpoints", () => {
    const line = createLine({ x1: 0, y1: 0, x2: 100, y2: 100 });
    const map = new Map();
    const getElementById = createGetElementById([line]);

    collectElementsForResize([line], map, getElementById);

    const data = map.get(line.id);
    expect(data.x1).toBe(0);
    expect(data.y1).toBe(0);
    expect(data.x2).toBe(100);
    expect(data.y2).toBe(100);
  });

  it("should collect path element data with bounds", () => {
    const path = createPath({ bounds: { x: 10, y: 20, width: 50, height: 60 }, d: "M0,0" });
    const map = new Map();
    const getElementById = createGetElementById([path]);

    collectElementsForResize([path], map, getElementById);

    const data = map.get(path.id);
    expect(data.bounds).toEqual({ x: 10, y: 20, width: 50, height: 60 });
    expect(data.d).toBe("M0,0");
  });

  it("should flatten groups and collect their children", () => {
    const rect = createRect();
    const ellipse = createEllipse();
    const group = createGroup([rect, ellipse]);
    const elements = [rect, ellipse, group];
    const map = new Map();
    const getElementById = createGetElementById(elements);

    collectElementsForResize([group], map, getElementById);

    expect(map.size).toBe(2);
    expect(map.has(rect.id)).toBe(true);
    expect(map.has(ellipse.id)).toBe(true);
    expect(map.has(group.id)).toBe(false);
  });
});

describe("collectElementsForRotation", () => {
  it("should collect rotation data for rect", () => {
    const rect = createRect({ x: 10, y: 20, width: 100, height: 50, rotation: 0.5 });
    const rotations = new Map();
    const elements = new Map();

    collectElementsForRotation([rect], rotations, elements);

    expect(rotations.get(rect.id)).toBe(0.5);
    const data = elements.get(rect.id);
    expect(data.x).toBe(10);
    expect(data.y).toBe(20);
    expect(data.rotation).toBe(0.5);
    expect(data.type).toBe("rect");
  });

  it("should collect ellipse data with center", () => {
    const ellipse = createEllipse({ cx: 100, cy: 200, rx: 50, ry: 30, rotation: 1.0 });
    const rotations = new Map();
    const elements = new Map();

    collectElementsForRotation([ellipse], rotations, elements);

    const data = elements.get(ellipse.id);
    expect(data.cx).toBe(100);
    expect(data.cy).toBe(200);
    expect(data.rx).toBe(50);
    expect(data.ry).toBe(30);
  });

  it("should collect line endpoints", () => {
    const line = createLine({ x1: 10, y1: 20, x2: 110, y2: 120 });
    const rotations = new Map();
    const elements = new Map();

    collectElementsForRotation([line], rotations, elements);

    const data = elements.get(line.id);
    expect(data.x1).toBe(10);
    expect(data.y1).toBe(20);
    expect(data.x2).toBe(110);
    expect(data.y2).toBe(120);
  });

  it("should collect path bounds", () => {
    const path = createPath({ bounds: { x: 5, y: 10, width: 100, height: 100 } });
    const rotations = new Map();
    const elements = new Map();

    collectElementsForRotation([path], rotations, elements);

    const data = elements.get(path.id);
    expect(data.bounds).toEqual({ x: 5, y: 10, width: 100, height: 100 });
  });

  it("should collect text anchor points", () => {
    const text = createText({ x: 50, y: 100 });
    const rotations = new Map();
    const elements = new Map();

    collectElementsForRotation([text], rotations, elements);

    const data = elements.get(text.id);
    expect(data.anchorX).toBe(50);
    expect(data.anchorY).toBe(100);
  });
});

describe("collectDraggableElements", () => {
  it("should collect rect position", () => {
    const rect = createRect({ x: 50, y: 100 });
    const map = new Map();
    const getElementById = createGetElementById([rect]);

    collectDraggableElements([rect.id], map, getElementById);

    const data = map.get(rect.id);
    expect(data?.x).toBe(50);
    expect(data?.y).toBe(100);
  });

  it("should collect ellipse center", () => {
    const ellipse = createEllipse({ cx: 150, cy: 200 });
    const map = new Map();
    const getElementById = createGetElementById([ellipse]);

    collectDraggableElements([ellipse.id], map, getElementById);

    const data = map.get(ellipse.id);
    expect(data?.cx).toBe(150);
    expect(data?.cy).toBe(200);
  });

  it("should collect line endpoints", () => {
    const line = createLine({ x1: 10, y1: 20, x2: 110, y2: 120 });
    const map = new Map();
    const getElementById = createGetElementById([line]);

    collectDraggableElements([line.id], map, getElementById);

    const data = map.get(line.id);
    expect(data?.x1).toBe(10);
    expect(data?.y1).toBe(20);
    expect(data?.x2).toBe(110);
    expect(data?.y2).toBe(120);
  });

  it("should collect path bounds position", () => {
    const path = createPath({ bounds: { x: 25, y: 35, width: 100, height: 100 } });
    const map = new Map();
    const getElementById = createGetElementById([path]);

    collectDraggableElements([path.id], map, getElementById);

    const data = map.get(path.id);
    expect(data?.x).toBe(25);
    expect(data?.y).toBe(35);
  });

  it("should collect text position", () => {
    const text = createText({ x: 75, y: 150 });
    const map = new Map();
    const getElementById = createGetElementById([text]);

    collectDraggableElements([text.id], map, getElementById);

    const data = map.get(text.id);
    expect(data?.x).toBe(75);
    expect(data?.y).toBe(150);
  });

  it("should flatten group and collect children", () => {
    const rect = createRect({ x: 10, y: 20 });
    const ellipse = createEllipse({ cx: 100, cy: 100 });
    const group = createGroup([rect, ellipse]);
    const elements = [rect, ellipse, group];
    const map = new Map();
    const getElementById = createGetElementById(elements);

    collectDraggableElements([group.id], map, getElementById);

    expect(map.size).toBe(2);
    expect(map.has(rect.id)).toBe(true);
    expect(map.has(ellipse.id)).toBe(true);
  });
});

describe("buildDragElementsMap", () => {
  it("should build map for rect", () => {
    const rect = createRect({ x: 10, y: 20 });
    const map = buildDragElementsMap(rect);

    expect(map.size).toBe(1);
    expect(map.get(rect.id)).toEqual({ x: 10, y: 20 });
  });

  it("should build map for ellipse", () => {
    const ellipse = createEllipse({ cx: 100, cy: 200 });
    const map = buildDragElementsMap(ellipse);

    expect(map.size).toBe(1);
    expect(map.get(ellipse.id)).toEqual({ x: 0, y: 0, cx: 100, cy: 200 });
  });

  it("should build map for line", () => {
    const line = createLine({ x1: 5, y1: 10, x2: 105, y2: 110 });
    const map = buildDragElementsMap(line);

    expect(map.size).toBe(1);
    expect(map.get(line.id)).toEqual({ x: 0, y: 0, x1: 5, y1: 10, x2: 105, y2: 110 });
  });

  it("should build map for path", () => {
    const path = createPath({ bounds: { x: 15, y: 25, width: 100, height: 100 } });
    const map = buildDragElementsMap(path);

    expect(map.size).toBe(1);
    expect(map.get(path.id)).toEqual({ x: 15, y: 25 });
  });

  it("should build map for text", () => {
    const text = createText({ x: 50, y: 75 });
    const map = buildDragElementsMap(text);

    expect(map.size).toBe(1);
    expect(map.get(text.id)).toEqual({ x: 50, y: 75 });
  });
});
