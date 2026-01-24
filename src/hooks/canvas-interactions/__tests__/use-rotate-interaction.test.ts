import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRotateInteraction } from "../use-rotate-interaction";
import {
  createEllipse,
  createGetElementById,
  createGroup,
  createLine,
  createPath,
  createRect,
  createScreenToWorld,
  createText,
  resetIdCounter,
} from "./test-utils";

// Mock the update scheduler
vi.mock("../update-scheduler", () => ({
  scheduleUpdate: vi.fn(),
}));

import { scheduleUpdate } from "../update-scheduler";

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

describe("useRotateInteraction", () => {
  const screenToWorld = createScreenToWorld();

  describe("startRotate", () => {
    it("should return false when no elements have bounds", () => {
      const getElementById = createGetElementById([]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      const success = result.current.startRotate(50, 50, "nw", [], setIsRotating);

      expect(success).toBe(false);
      expect(setIsRotating).not.toHaveBeenCalled();
    });

    it("should initialize rotation for a single rect", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100, rotation: 0 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      const success = result.current.startRotate(100, 50, "ne", [rect], setIsRotating);

      expect(success).toBe(true);
      expect(setIsRotating).toHaveBeenCalledWith(true);
      expect(result.current.rotateStartRef.current).not.toBeNull();
      expect(result.current.rotateStartRef.current?.centerX).toBe(50);
      expect(result.current.rotateStartRef.current?.centerY).toBe(50);
    });

    it("should store original rotations for elements", () => {
      const rect = createRect({ rotation: Math.PI / 4 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      result.current.startRotate(100, 50, "ne", [rect], setIsRotating);

      const originalRotation = result.current.rotateStartRef.current?.originalRotations.get(rect.id);
      expect(originalRotation).toBe(Math.PI / 4);
    });

    it("should handle group rotation by storing group separately", () => {
      const rect = createRect();
      const group = createGroup([rect], { rotation: Math.PI / 2 });
      const elements = [rect, group];
      const getElementById = createGetElementById(elements);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      result.current.startRotate(100, 50, "ne", [group], setIsRotating);

      // Group rotation should be stored
      const groupEntry = result.current.rotateStartRef.current?.originalElements.get(group.id);
      expect(groupEntry?.type).toBe("group");
      expect(groupEntry?.rotation).toBe(Math.PI / 2);
    });

    it("should calculate center from multiple elements", () => {
      const rect1 = createRect({ x: 0, y: 0, width: 50, height: 50 });
      const rect2 = createRect({ x: 100, y: 100, width: 50, height: 50 });
      const elements = [rect1, rect2];
      const getElementById = createGetElementById(elements);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      result.current.startRotate(150, 150, "se", elements, setIsRotating);

      // Center should be between both elements
      expect(result.current.rotateStartRef.current?.centerX).toBe(75);
      expect(result.current.rotateStartRef.current?.centerY).toBe(75);
    });
  });

  describe("updateRotate", () => {
    it("should not update when not started", () => {
      const getElementById = createGetElementById([]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      act(() => {
        result.current.updateRotate(100, 100);
      });

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it("should calculate new rotation for rect", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100, rotation: 0 });
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "e", [rect], setIsRotating); // Start at right center
      });

      act(() => {
        result.current.updateRotate(50, 100); // Move to bottom center (90 degrees)
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      expect(call.type).toBe("rotate");
      expect(call.updates).toBeDefined();
      const update = call.updates?.get(rect.id);
      expect(update?.rotation).toBeDefined();
    });

    it("should update group rotation only", () => {
      const rect = createRect({ x: 0, y: 0, width: 100, height: 100 });
      const group = createGroup([rect], { rotation: 0 });
      const elements = [rect, group];
      const getElementById = createGetElementById(elements);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "e", [group], setIsRotating);
      });

      act(() => {
        result.current.updateRotate(50, 100);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      const groupUpdate = call.updates?.get(group.id);
      expect(groupUpdate?.rotation).toBeDefined();
    });

    it("should handle line rotation by moving endpoints", () => {
      const line = createLine({ x1: 0, y1: 50, x2: 100, y2: 50 });
      const getElementById = createGetElementById([line]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "se", [line], setIsRotating);
      });

      act(() => {
        result.current.updateRotate(50, 100);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      const update = call.updates?.get(line.id);
      expect(update?.x1).toBeDefined();
      expect(update?.y1).toBeDefined();
      expect(update?.x2).toBeDefined();
      expect(update?.y2).toBeDefined();
    });

    it("should handle ellipse rotation", () => {
      const ellipse = createEllipse({ cx: 50, cy: 50, rx: 50, ry: 30, rotation: 0 });
      const getElementById = createGetElementById([ellipse]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "e", [ellipse], setIsRotating);
      });

      act(() => {
        result.current.updateRotate(50, 80);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      const update = call.updates?.get(ellipse.id);
      expect(update?.rotation).toBeDefined();
    });

    it("should handle path rotation", () => {
      const path = createPath({ bounds: { x: 0, y: 0, width: 100, height: 100 }, rotation: 0 });
      const getElementById = createGetElementById([path]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "e", [path], setIsRotating);
      });

      act(() => {
        result.current.updateRotate(50, 100);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
      const call = vi.mocked(scheduleUpdate).mock.calls[0][0];
      const update = call.updates?.get(path.id);
      expect(update?.bounds).toBeDefined();
      expect(update?.rotation).toBeDefined();
    });

    it("should handle text rotation", () => {
      const text = createText({ x: 0, y: 0, bounds: { x: 0, y: 0, width: 50, height: 20 }, rotation: 0 });
      const getElementById = createGetElementById([text]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(50, 10, "e", [text], setIsRotating);
      });

      act(() => {
        result.current.updateRotate(25, 30);
      });

      expect(scheduleUpdate).toHaveBeenCalled();
    });
  });

  describe("endRotate", () => {
    it("should clear state", () => {
      const rect = createRect();
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "ne", [rect], setIsRotating);
      });

      expect(result.current.rotateStartRef.current).not.toBeNull();

      act(() => {
        result.current.endRotate();
      });

      expect(result.current.rotateStartRef.current).toBeNull();
    });
  });

  describe("getActiveHandle", () => {
    it("should return handle during rotation", () => {
      const rect = createRect();
      const getElementById = createGetElementById([rect]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      const setIsRotating = vi.fn();
      act(() => {
        result.current.startRotate(100, 50, "ne", [rect], setIsRotating);
      });

      expect(result.current.getActiveHandle()).toBe("ne");
    });

    it("should return null when not rotating", () => {
      const getElementById = createGetElementById([]);
      const { result } = renderHook(() => useRotateInteraction(screenToWorld, getElementById));

      expect(result.current.getActiveHandle()).toBeNull();
    });
  });
});
