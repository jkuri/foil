import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResizeHandle, useResizeInteraction } from "../use-resize-interaction";
import {
  createGetElementById,
  createGroup,
  createLine,
  createRect,
  createScreenToWorld,
  resetIdCounter,
} from "./test-utils";

// Mock dependencies
vi.mock("../update-scheduler", () => ({
  scheduleUpdate: vi.fn(),
}));

vi.mock("@/store", () => ({
  useCanvasStore: {
    getState: () => ({
      snapToGrid: false,
      snapToObjects: false,
      snapToGeometry: false,
      smartGuides: [],
    }),
  },
}));

vi.mock("@/lib/svg-import", () => ({
  resizePath: vi.fn((d) => d),
}));

import { scheduleUpdate } from "../update-scheduler";

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

describe("useResizeInteraction", () => {
  const screenToWorld = createScreenToWorld();

  describe("startResize", () => {
    it("should return false when no elements have bounds", () => {
      const getElementById = createGetElementById([]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      const success = result.current.startResize(50, 50, "se", [], setIsResizing);

      expect(success).toBe(false);
      expect(setIsResizing).not.toHaveBeenCalled();
    });

    it("should initialize resize for a single rect", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      const success = result.current.startResize(100, 100, "se", [rect], setIsResizing);

      expect(success).toBe(true);
      expect(setIsResizing).toHaveBeenCalledWith(true, "se");
      expect(result.current.resizeStartRef.current).not.toBeNull();
      expect(result.current.resizeStartRef.current?.handle).toBe("se");
    });

    it("should store original bounds", () => {
      const rect = createRect({ x: 10, y: 20, width: 100, height: 50 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      result.current.startResize(110, 70, "se", [rect], setIsResizing);

      expect(result.current.resizeStartRef.current?.originalBounds).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it("should detect single rotated element", () => {
      const rect = createRect({ rotation: Math.PI / 4 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      result.current.startResize(100, 100, "se", [rect], setIsResizing);

      expect(result.current.resizeStartRef.current?.isSingleRotatedElement).toBe(true);
      expect(result.current.resizeStartRef.current?.elementRotation).toBe(Math.PI / 4);
    });

    it("should handle line as single rotated element", () => {
      const line = createLine();
      const getElementById = createGetElementById([line]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      result.current.startResize(100, 100, "se", [line], setIsResizing);

      expect(result.current.resizeStartRef.current?.isSingleRotatedElement).toBe(true);
    });
  });

  describe("updateResize", () => {
    it("should not update when not started", () => {
      const getElementById = createGetElementById([]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      act(() => {
        result.current.updateResize(150, 150, false);
      });

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it("should resize rect from se handle", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      act(() => {
        result.current.startResize(100, 100, "se", [rect], setIsResizing);
      });

      act(() => {
        result.current.updateResize(150, 150, false);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
    });

    it("should resize line endpoints", () => {
      const line = createLine({ x1: 0, y1: 0, x2: 100, y2: 100 });
      const getElementById = createGetElementById([line]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      act(() => {
        result.current.startResize(100, 100, "se", [line], setIsResizing);
      });

      act(() => {
        result.current.updateResize(150, 150, false);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      expect(call.singleUpdate?.data.x2).toBeDefined();
      expect(call.singleUpdate?.data.y2).toBeDefined();
    });

    it("should resize from nw handle", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      act(() => {
        result.current.startResize(0, 0, "nw", [rect], setIsResizing);
      });

      act(() => {
        result.current.updateResize(-50, -50, false);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
    });

    it("should maintain minimum size", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      act(() => {
        result.current.startResize(100, 100, "se", [rect], setIsResizing);
      });

      // Try to make element very small
      act(() => {
        result.current.updateResize(5, 5, false);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
    });
  });

  describe("endResize", () => {
    it("should clear state", () => {
      const rect = createRect();
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useResizeInteraction(screenToWorld, getElementById));

      const setIsResizing = vi.fn();
      act(() => {
        result.current.startResize(100, 100, "se", [rect], setIsResizing);
      });

      expect(result.current.resizeStartRef.current).not.toBeNull();

      act(() => {
        result.current.endResize();
      });

      expect(result.current.resizeStartRef.current).toBeNull();
    });
  });
});

describe("getResizeHandle", () => {
  it("should use hitTestRotatedElementHandle for single non-group element", () => {
    const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
    const getElementById = createGetElementById([rect]);
    const mockHitTestRotatedElement = vi.fn().mockReturnValue("se");
    const mockHitTestBounds = vi.fn();

    const result = getResizeHandle(100, 100, [rect], 1, getElementById, mockHitTestRotatedElement, mockHitTestBounds);

    expect(mockHitTestRotatedElement).toHaveBeenCalled();
    expect(mockHitTestBounds).not.toHaveBeenCalled();
    expect(result).toBe("se");
  });

  it("should use hitTestBoundsHandle for group", () => {
    const rect = createRect();
    const group = createGroup([rect]);
    const elements = [rect, group];
    const getElementById = createGetElementById(elements);
    const mockHitTestRotatedElement = vi.fn();
    const mockHitTestBounds = vi.fn().mockReturnValue("nw");

    const result = getResizeHandle(0, 0, [group], 1, getElementById, mockHitTestRotatedElement, mockHitTestBounds);

    expect(mockHitTestBounds).toHaveBeenCalled();
    expect(result).toBe("nw");
  });

  it("should use hitTestBoundsHandle for multiple elements", () => {
    const rect1 = createRect({ x: 0, y: 0, width: 50, height: 50 });
    const rect2 = createRect({ x: 100, y: 100, width: 50, height: 50 });
    const elements = [rect1, rect2];
    const getElementById = createGetElementById(elements);
    const mockHitTestRotatedElement = vi.fn();
    const mockHitTestBounds = vi.fn().mockReturnValue("se");

    const result = getResizeHandle(150, 150, elements, 1, getElementById, mockHitTestRotatedElement, mockHitTestBounds);

    expect(mockHitTestBounds).toHaveBeenCalled();
    expect(result).toBe("se");
  });

  it("should return null when no elements", () => {
    const getElementById = createGetElementById([]);
    const mockHitTestRotatedElement = vi.fn();
    const mockHitTestBounds = vi.fn();

    const result = getResizeHandle(100, 100, [], 1, getElementById, mockHitTestRotatedElement, mockHitTestBounds);

    expect(result).toBeNull();
  });
});
