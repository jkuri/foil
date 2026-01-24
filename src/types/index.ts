export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

export interface LinearGradient {
  type: "linearGradient";
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
  gradientUnits?: "userSpaceOnUse" | "objectBoundingBox";
  gradientTransform?: string;
}

export interface RadialGradient {
  type: "radialGradient";
  id: string;
  cx: number;
  cy: number;
  r: number;
  fx?: number;
  fy?: number;
  stops: GradientStop[];
  gradientUnits?: "userSpaceOnUse" | "objectBoundingBox";
  gradientTransform?: string;
}

export interface SVGPattern {
  type: "pattern";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  patternUnits?: "userSpaceOnUse" | "objectBoundingBox";
  patternContentUnits?: "userSpaceOnUse" | "objectBoundingBox";
  patternTransform?: string;
  viewBox?: string;

  content?: string;
}

export interface SVGFilter {
  type: "filter";
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  filterUnits?: "userSpaceOnUse" | "objectBoundingBox";

  content: string;
}

export interface SVGClipPath {
  type: "clipPath";
  id: string;
  clipPathUnits?: "userSpaceOnUse" | "objectBoundingBox";

  content: string;
}

export interface SVGMask {
  type: "mask";
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maskUnits?: "userSpaceOnUse" | "objectBoundingBox";
  maskContentUnits?: "userSpaceOnUse" | "objectBoundingBox";

  content: string;
}

export interface SVGSymbol {
  type: "symbol";
  id: string;
  viewBox?: string;

  content: string;
}

export interface SVGDefs {
  gradients: Map<string, LinearGradient | RadialGradient>;
  patterns: Map<string, SVGPattern>;
  filters: Map<string, SVGFilter>;
  clipPaths: Map<string, SVGClipPath>;
  masks: Map<string, SVGMask>;
  symbols: Map<string, SVGSymbol>;
}

export type Fill = string | { ref: string; type: "gradient" | "pattern" } | null;
export type Stroke = {
  color: string | { ref: string; type: "gradient" };
  width: number;
  opacity?: number;
  dashArray?: number[];
  lineCap?: "butt" | "round" | "square";
} | null;

interface BaseElement {
  id: string;
  name: string;
  rotation: number;
  fill: Fill;
  fillOpacity?: number;
  stroke: Stroke;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  parentId?: string;
  aspectRatioLocked?: boolean;
}

export interface RectElement extends BaseElement {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  markerStart?: "none" | "arrow" | "triangle" | "reversed_triangle" | "circle" | "diamond" | "round" | "square";
  markerEnd?: "none" | "arrow" | "triangle" | "reversed_triangle" | "circle" | "diamond" | "round" | "square";
}

export interface PathElement extends BaseElement {
  type: "path";
  d: string;

  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  _cachedVertices?: Float32Array;
  _cachedFillVertices?: Float32Array;
}

export interface TextElement extends BaseElement {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: "normal" | "bold" | number;
  textAnchor?: "start" | "middle" | "end";

  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PolygonElement extends BaseElement {
  type: "polygon";
  points: { x: number; y: number }[];

  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PolylineElement extends BaseElement {
  type: "polyline";
  points: { x: number; y: number }[];

  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageElement extends BaseElement {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  preserveAspectRatio?: "none" | "xMidYMid" | "xMinYMin" | "xMaxYMax";

  _texture?: WebGLTexture;
}

export interface GroupElement extends Omit<BaseElement, "fill" | "stroke"> {
  type: "group";
  childIds: string[];
  expanded?: boolean;
}

export type Shape =
  | RectElement
  | EllipseElement
  | LineElement
  | PathElement
  | TextElement
  | PolygonElement
  | PolylineElement
  | ImageElement;
export type CanvasElement = Shape | GroupElement;
export type ElementType = CanvasElement["type"];

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Tool = "select" | "pan" | "rect" | "ellipse" | "line" | "text";
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;

export interface SmartGuide {
  type: "alignment" | "spacing" | "center";

  axis?: "x" | "y";
  position?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  label?: string;

  cx?: number;
  cy?: number;
}
