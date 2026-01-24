import { vi } from "vitest";
import type {
  CanvasElement,
  EllipseElement,
  GroupElement,
  ImageElement,
  LineElement,
  PathElement,
  RectElement,
  TextElement,
} from "@/types";

let idCounter = 0;

function generateId(): string {
  return `test-${++idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export function createRect(overrides: Partial<RectElement> = {}): RectElement {
  return {
    id: generateId(),
    type: "rect",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    fill: "#000000",
    stroke: { color: "#000000", width: 1 },
    opacity: 1,
    visible: true,
    locked: false,
    name: "Rectangle",
    aspectRatioLocked: false,
    ...overrides,
  };
}

export function createEllipse(overrides: Partial<EllipseElement> = {}): EllipseElement {
  return {
    id: generateId(),
    type: "ellipse",
    cx: 50,
    cy: 50,
    rx: 50,
    ry: 50,
    rotation: 0,
    fill: "#000000",
    stroke: { color: "#000000", width: 1 },
    opacity: 1,
    visible: true,
    locked: false,
    name: "Ellipse",
    aspectRatioLocked: false,
    ...overrides,
  };
}

export function createLine(overrides: Partial<LineElement> = {}): LineElement {
  return {
    id: generateId(),
    type: "line",
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 100,
    rotation: 0,
    fill: null,
    stroke: { color: "#000000", width: 1 },
    opacity: 1,
    visible: true,
    locked: false,
    name: "Line",
    aspectRatioLocked: false,
    ...overrides,
  };
}

export function createPath(overrides: Partial<PathElement> = {}): PathElement {
  return {
    id: generateId(),
    type: "path",
    d: "M0,0 L100,100",
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    rotation: 0,
    fill: "#000000",
    stroke: { color: "#000000", width: 1 },
    opacity: 1,
    visible: true,
    locked: false,
    name: "Path",
    aspectRatioLocked: false,
    ...overrides,
  };
}

export function createText(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: generateId(),
    type: "text",
    x: 0,
    y: 0,
    text: "Test",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: 400,
    rotation: 0,
    fill: "#000000",
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    name: "Text",
    aspectRatioLocked: false,
    bounds: { x: 0, y: 0, width: 50, height: 20 },
    ...overrides,
  };
}

export function createImage(overrides: Partial<ImageElement> = {}): ImageElement {
  return {
    id: generateId(),
    type: "image",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    href: "data:image/png;base64,test",
    fill: null,
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    name: "Image",
    aspectRatioLocked: true,
    ...overrides,
  };
}

export function createGroup(children: CanvasElement[], overrides: Partial<GroupElement> = {}): GroupElement {
  const group: GroupElement = {
    id: generateId(),
    type: "group",
    childIds: children.map((c) => c.id),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    name: "Group",
    aspectRatioLocked: false,
    ...overrides,
  };

  for (const child of children) {
    child.parentId = group.id;
  }

  return group;
}

export function createGetElementById(elements: CanvasElement[]): (id: string) => CanvasElement | undefined {
  const map = new Map<string, CanvasElement>();
  for (const el of elements) {
    map.set(el.id, el);
  }
  return (id: string) => map.get(id);
}

export function createScreenToWorld(offsetX = 0, offsetY = 0, scale = 1) {
  return (screenX: number, screenY: number) => ({
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  });
}

export function createMockCanvasStore(
  initialState: Partial<{
    elements: CanvasElement[];
    selectedIds: string[];
    snapToGrid: boolean;
    snapToObjects: boolean;
    snapToGeometry: boolean;
    gridSize: number;
    smartGuides: unknown[];
  }> = {},
) {
  const state = {
    elements: [],
    selectedIds: [],
    snapToGrid: false,
    snapToObjects: false,
    snapToGeometry: false,
    gridSize: 10,
    smartGuides: [],
    ...initialState,
  };

  return {
    getState: () => ({
      ...state,
      setSmartGuides: vi.fn(),
      updateElements: vi.fn(),
      updateElement: vi.fn(),
      setSelectionBox: vi.fn(),
      setSelectedIds: vi.fn(),
    }),
  };
}
