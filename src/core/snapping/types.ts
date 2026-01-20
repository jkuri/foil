import type { SmartGuide } from "@/types";

export type SnapLineType = "start" | "center" | "end";
export type SnapAxis = "x" | "y";

export interface SnapLine {
  value: number;
  type: SnapLineType;
  origin: number; // The perpendicular value (e.g., y for a vertical line) to help guide drawing
  range: [number, number]; // The perpendicular range (min, max)
  elementId: string;
}

export interface SnapState {
  verticalLines: SnapLine[]; // Sorted by value (x)
  horizontalLines: SnapLine[]; // Sorted by value (y)
  xSortedBounds: Bounds[]; // Sorted by minX
  ySortedBounds: Bounds[]; // Sorted by minY
  points: Point[]; // For point snapping
}

export interface Bounds {
  id?: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SmartGuide[];
}
