import type { BoundingBox, CanvasElement, EllipseElement, Fill, LineElement } from "@/types";

export interface ElementTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function getElementBounds(element: CanvasElement): BoundingBox {
  switch (element.type) {
    case "rect":
      return { x: element.x, y: element.y, width: element.width, height: element.height };
    case "ellipse":
      return {
        x: element.cx - element.rx,
        y: element.cy - element.ry,
        width: element.rx * 2,
        height: element.ry * 2,
      };
    case "line": {
      const minX = Math.min(element.x1, element.x2);
      const minY = Math.min(element.y1, element.y2);
      const maxX = Math.max(element.x1, element.x2);
      const maxY = Math.max(element.y1, element.y2);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case "path":
      return element.bounds;
    case "text":
      if (element.bounds) {
        return {
          x: element.x + element.bounds.x,
          y: element.y + element.bounds.y,
          width: element.bounds.width,
          height: element.bounds.height,
        };
      }
      return {
        x: element.x,
        y: element.y - element.fontSize,
        width: element.text.length * element.fontSize * 0.6,
        height: element.fontSize * 1.2,
      };
    case "polygon":
    case "polyline": {
      if (element.bounds) return element.bounds;
      if (element.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = element.points[0].x;
      let minY = element.points[0].y;
      let maxX = minX;
      let maxY = minY;
      for (const pt of element.points) {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case "image":
      return { x: element.x, y: element.y, width: element.width, height: element.height };
    case "group":
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function getElementTransform(element: CanvasElement): ElementTransform {
  if (element.type === "rect") {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
    };
  }
  if (element.type === "ellipse") {
    const el = element as EllipseElement;
    return {
      x: el.cx - el.rx,
      y: el.cy - el.ry,
      width: el.rx * 2,
      height: el.ry * 2,
      rotation: el.rotation || 0,
    };
  }
  if (element.type === "line") {
    const el = element as LineElement;
    const dx = el.x2 - el.x1;
    const dy = el.y2 - el.y1;
    return {
      x: (el.x1 + el.x2) / 2,
      y: (el.y1 + el.y2) / 2,
      width: Math.sqrt(dx * dx + dy * dy),
      height: 0,
      rotation: Math.atan2(dy, dx),
    };
  }
  if (element.type === "image") {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
    };
  }
  return { x: 0, y: 0, width: 0, height: 0, rotation: element.rotation || 0 };
}

export function getElementCenter(element: CanvasElement): { x: number; y: number } {
  const bounds = getElementBounds(element);
  if (element.type === "ellipse") {
    return { x: element.cx, y: element.cy };
  }
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export function getFillColor(fill: Fill, defaultColor = "#000000"): string | null {
  if (fill === null) return null;
  if (typeof fill === "string") return fill;

  return defaultColor;
}

export function getStrokeColor(color: string | { ref: string; type: "gradient" }, defaultColor = "#000000"): string {
  if (typeof color === "string") return color;

  return defaultColor;
}

export function isFillReference(fill: Fill): fill is { ref: string; type: "gradient" | "pattern" } {
  return fill !== null && typeof fill === "object" && "ref" in fill;
}

export function isStrokeColorReference(color: string | { ref: string; type: "gradient" }): color is { ref: string; type: "gradient" } {
  return typeof color === "object" && "ref" in color;
}
