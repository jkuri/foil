import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMarqueeInteraction } from "../use-marquee-interaction";
import { createRect, createScreenToWorld, resetIdCounter } from "./test-utils";

// Mock dependencies
vi.mock("../update-scheduler", () => ({
  scheduleUpdate: vi.fn(),
}));

vi.mock("@/store", () => ({
  useCanvasStore: {
    getState: () => ({
      elements: [],
    }),
  },
}));

vi.mock("@/core", () => ({
  getShapesInBox: vi.fn().mockReturnValue([]),
}));

import { getShapesInBox } from "@/core";
import { scheduleUpdate } from "../update-scheduler";

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

describe("useMarqueeInteraction", () => {
  const screenToWorld = createScreenToWorld();

  describe("startMarquee", () => {
    it("should initialize marquee state", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      expect(setIsMarqueeSelecting).toHaveBeenCalledWith(true);
      expect(result.current.marqueeStartRef.current).not.toBeNull();
      expect(result.current.marqueeStartRef.current?.worldX).toBe(100);
      expect(result.current.marqueeStartRef.current?.worldY).toBe(100);
    });

    it("should clear selection when shift is not pressed", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(
          100,
          100,
          ["existing-id"],
          false,
          setIsMarqueeSelecting,
          setSelectedIds,
          setSelectionBox,
        );
      });

      expect(setSelectedIds).toHaveBeenCalledWith([]);
    });

    it("should preserve selection when shift is pressed", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(
          100,
          100,
          ["existing-id"],
          true,
          setIsMarqueeSelecting,
          setSelectedIds,
          setSelectionBox,
        );
      });

      expect(setSelectedIds).not.toHaveBeenCalled();
    });

    it("should set initial selection box", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      expect(setSelectionBox).toHaveBeenCalledWith({
        startX: 100,
        startY: 100,
        endX: 100,
        endY: 100,
      });
    });
  });

  describe("updateMarquee", () => {
    it("should not update when not started", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      act(() => {
        result.current.updateMarquee(200, 200, []);
      });

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it("should update selection box", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      act(() => {
        result.current.updateMarquee(200, 200, []);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      expect(call.type).toBe("marquee");
      expect(call.selectionBox).toEqual({
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
      });
    });

    it("should include elements in selection box", () => {
      const rect = createRect({ x: 150, y: 150, width: 30, height: 30 });
      vi.mocked(getShapesInBox).mockReturnValue([rect]);

      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      act(() => {
        result.current.updateMarquee(200, 200, []);
      });

      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      expect(call.selectedIds).toContain(rect.id);
    });

    it("should add to existing selection when shift was held", () => {
      const existingRect = createRect();
      const newRect = createRect();
      vi.mocked(getShapesInBox).mockReturnValue([newRect]);

      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(
          100,
          100,
          [existingRect.id],
          true,
          setIsMarqueeSelecting,
          setSelectedIds,
          setSelectionBox,
        );
      });

      act(() => {
        result.current.updateMarquee(200, 200, [existingRect.id]);
      });

      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      expect(call.selectedIds).toContain(existingRect.id);
      expect(call.selectedIds).toContain(newRect.id);
    });
  });

  describe("endMarquee", () => {
    it("should not do anything when not started", () => {
      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.endMarquee(setSelectedIds, setSelectionBox);
      });

      expect(setSelectedIds).not.toHaveBeenCalled();
      expect(setSelectionBox).not.toHaveBeenCalled();
    });

    it("should finalize selection and clear box", () => {
      vi.mocked(getShapesInBox).mockReturnValue([]);

      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      act(() => {
        result.current.endMarquee(setSelectedIds, setSelectionBox);
      });

      expect(setSelectedIds).toHaveBeenCalled();
      expect(setSelectionBox).toHaveBeenCalledWith(null);
    });

    it("should clear state after ending", () => {
      vi.mocked(getShapesInBox).mockReturnValue([]);

      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      expect(result.current.marqueeStartRef.current).not.toBeNull();

      act(() => {
        result.current.endMarquee(setSelectedIds, setSelectionBox);
      });

      expect(result.current.marqueeStartRef.current).toBeNull();
    });

    it("should include selected elements in final selection", () => {
      const rect = createRect();
      vi.mocked(getShapesInBox).mockReturnValue([rect]);

      const { result } = renderHook(() => useMarqueeInteraction(screenToWorld));

      const setIsMarqueeSelecting = vi.fn();
      const setSelectedIds = vi.fn();
      const setSelectionBox = vi.fn();

      act(() => {
        result.current.startMarquee(100, 100, [], false, setIsMarqueeSelecting, setSelectedIds, setSelectionBox);
      });

      act(() => {
        result.current.endMarquee(setSelectedIds, setSelectionBox);
      });

      expect(setSelectedIds).toHaveBeenCalledWith([rect.id]);
    });
  });
});
