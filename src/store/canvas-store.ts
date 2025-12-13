import { create } from "zustand";
import type { ResizeHandle, Shape, Tool, Transform } from "@/types";

interface CanvasState {
  // Shapes
  shapes: Shape[];
  selectedIds: string[];

  // Transform
  transform: Transform;

  // Tools & Interaction
  activeTool: Tool;
  isSpaceHeld: boolean;
  isPanning: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  isMarqueeSelecting: boolean;
  hoveredHandle: ResizeHandle;
  activeResizeHandle: ResizeHandle;

  // Context menu
  contextMenuTarget: Shape | null;

  // Selection box
  selectionBox: { startX: number; startY: number; endX: number; endY: number } | null;
}

interface CanvasActions {
  // Shape actions
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Omit<Shape, "id">>) => void;
  deleteShape: (id: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => string[];
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Selection actions
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;

  // Transform actions
  setTransform: (transform: Partial<Transform>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (scale: number) => void;
  resetView: () => void;

  // Tool actions
  setActiveTool: (tool: Tool) => void;
  setIsSpaceHeld: (held: boolean) => void;

  // Interaction state
  setIsPanning: (panning: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsResizing: (resizing: boolean, handle?: ResizeHandle) => void;
  setIsRotating: (rotating: boolean) => void;
  setIsMarqueeSelecting: (selecting: boolean) => void;
  setHoveredHandle: (handle: ResizeHandle) => void;
  setActiveResizeHandle: (handle: ResizeHandle) => void;
  setContextMenuTarget: (shape: Shape | null) => void;
  setSelectionBox: (box: { startX: number; startY: number; endX: number; endY: number } | null) => void;

  // Helpers
  getShapeById: (id: string) => Shape | undefined;
  getSelectedShapes: () => Shape[];
}

const DEFAULT_SHAPES: Shape[] = [
  { id: "1", type: "rect", x: 100, y: 100, width: 200, height: 150, rotation: 0, color: [0.4, 0.6, 1, 1] },
  { id: "2", type: "rect", x: 350, y: 200, width: 150, height: 150, rotation: 0, color: [1, 0.5, 0.3, 1] },
  { id: "3", type: "rect", x: 200, y: 350, width: 180, height: 120, rotation: 0, color: [0.5, 0.9, 0.5, 1] },
  { id: "4", type: "rect", x: -100, y: -100, width: 120, height: 120, rotation: 0, color: [0.9, 0.4, 0.8, 1] },
];

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  // Initial state
  shapes: DEFAULT_SHAPES,
  selectedIds: [],
  transform: { x: 0, y: 0, scale: 1 },
  activeTool: "select",
  isSpaceHeld: false,
  isPanning: false,
  isDragging: false,
  isResizing: false,
  isRotating: false,
  isMarqueeSelecting: false,
  hoveredHandle: null,
  activeResizeHandle: null,
  contextMenuTarget: null,
  selectionBox: null,

  // Shape actions
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  deleteSelected: () =>
    set((state) => ({
      shapes: state.shapes.filter((s) => !state.selectedIds.includes(s.id)),
      selectedIds: [],
    })),

  duplicateSelected: () => {
    const state = get();
    const newShapes: Shape[] = [];
    const newIds: string[] = [];

    for (const id of state.selectedIds) {
      const shape = state.shapes.find((s) => s.id === id);
      if (shape) {
        const newShape: Shape = {
          ...shape,
          id: crypto.randomUUID(),
          x: shape.x + 20,
          y: shape.y + 20,
        };
        newShapes.push(newShape);
        newIds.push(newShape.id);
      }
    }

    set((state) => ({
      shapes: [...state.shapes, ...newShapes],
      selectedIds: newIds,
    }));

    return newIds;
  },

  bringToFront: (id) =>
    set((state) => {
      const idx = state.shapes.findIndex((s) => s.id === id);
      if (idx === -1) return state;
      const shape = state.shapes[idx];
      const newShapes = [...state.shapes.slice(0, idx), ...state.shapes.slice(idx + 1), shape];
      return { shapes: newShapes };
    }),

  sendToBack: (id) =>
    set((state) => {
      const idx = state.shapes.findIndex((s) => s.id === id);
      if (idx === -1) return state;
      const shape = state.shapes[idx];
      const newShapes = [shape, ...state.shapes.slice(0, idx), ...state.shapes.slice(idx + 1)];
      return { shapes: newShapes };
    }),

  // Selection actions
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  selectAll: () => set((state) => ({ selectedIds: state.shapes.map((s) => s.id) })),
  clearSelection: () => set({ selectedIds: [] }),
  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  // Transform actions
  setTransform: (transform) => set((state) => ({ transform: { ...state.transform, ...transform } })),

  zoomIn: () =>
    set((state) => ({
      transform: { ...state.transform, scale: Math.min(state.transform.scale * 1.2, 10) },
    })),

  zoomOut: () =>
    set((state) => ({
      transform: { ...state.transform, scale: Math.max(state.transform.scale / 1.2, 0.1) },
    })),

  zoomTo: (scale) =>
    set((state) => ({
      transform: { ...state.transform, scale: Math.max(0.1, Math.min(10, scale)) },
    })),

  resetView: () => set({ transform: { x: 0, y: 0, scale: 1 } }),

  // Tool actions
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsSpaceHeld: (held) => set({ isSpaceHeld: held }),

  // Interaction state
  setIsPanning: (panning) => set({ isPanning: panning }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setIsResizing: (resizing, handle) =>
    set({ isResizing: resizing, activeResizeHandle: resizing ? (handle ?? null) : null }),
  setIsRotating: (rotating) => set({ isRotating: rotating }),
  setIsMarqueeSelecting: (selecting) => set({ isMarqueeSelecting: selecting }),
  setHoveredHandle: (handle) => set({ hoveredHandle: handle }),
  setActiveResizeHandle: (handle) => set({ activeResizeHandle: handle }),
  setContextMenuTarget: (shape) => set({ contextMenuTarget: shape }),
  setSelectionBox: (box) => set({ selectionBox: box }),

  // Helpers
  getShapeById: (id) => get().shapes.find((s) => s.id === id),
  getSelectedShapes: () => {
    const state = get();
    return state.shapes.filter((s) => state.selectedIds.includes(s.id));
  },
}));
