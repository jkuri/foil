import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getShapesInBox, hitTestResizeHandle, hitTestShape, WebGLRenderer } from "@/core";
import { useCanvasControls, useCanvasInteractions } from "@/hooks";
import { useCanvasStore } from "@/store";
import { CanvasContextMenu } from "./canvas-context-menu";
import { CanvasMenubar } from "./canvas-menubar";
import { CanvasToolbar } from "./canvas-toolbar";
import { DimensionLabel } from "./dimension-label";

export function WebGLCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const [isCmdHeld, setIsCmdHeld] = useState(false);

  const {
    shapes,
    selectedIds,
    transform,
    activeTool,
    isSpaceHeld,
    isPanning,
    isDragging,
    isResizing,
    isRotating,
    activeResizeHandle,
    selectionBox,
    setIsSpaceHeld,
    setActiveTool,
    clearSelection,
    deleteSelected,
    duplicateSelected,
  } = useCanvasStore();

  const { handlers, actions } = useCanvasControls();

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (screenX - rect.left - transform.x) / transform.scale,
        y: (screenY - rect.top - transform.y) / transform.scale,
      };
    },
    [transform],
  );

  const hitTest = useCallback((worldX: number, worldY: number) => hitTestShape(worldX, worldY, shapes), [shapes]);

  const hitTestHandle = useCallback(
    (worldX: number, worldY: number, shape: (typeof shapes)[0]) => hitTestResizeHandle(worldX, worldY, shape),
    [],
  );

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    getCursorForHandle,
    getRotationCursorForHandle,
    hoveredHandle,
    activeRotationHandle,
  } = useCanvasInteractions({
    screenToWorld,
    hitTest,
    hitTestResizeHandle: hitTestHandle,
    handlers,
    actions,
  });

  // Initialize WebGL renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const renderer = new WebGLRenderer(canvasRef.current);
      rendererRef.current = renderer;
      renderer.startRenderLoop(() => useCanvasStore.getState());
    } catch (error) {
      console.error("Failed to initialize WebGL:", error);
    }
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Mark renderer dirty when state changes
  useEffect(() => {
    rendererRef.current?.markDirty();
  }, [shapes, selectedIds, selectionBox]);

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const { width, height } = entries[0].contentRect;
      renderer.resize(width, height);
      renderer.markDirty();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const { width, height } = container.getBoundingClientRect();
    renderer.resize(width, height);

    return () => resizeObserver.disconnect();
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!containerRef.current) return;
      handlers.handleWheel(e, containerRef.current.getBoundingClientRect());
    },
    [handlers],
  );

  const onMouseUp = useCallback(() => {
    handleMouseUp((box) => getShapesInBox(box, shapes));
  }, [handleMouseUp, shapes]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
      if (e.metaKey || e.ctrlKey) setIsCmdHeld(true);
      if (e.code === "KeyV") setActiveTool("select");
      if (e.code === "KeyH") setActiveTool("pan");
      if (e.code === "KeyZ") setActiveTool("zoom");
      if (e.code === "Escape") clearSelection();
      if ((e.code === "Delete" || e.code === "Backspace") && selectedIds.length > 0) {
        deleteSelected();
      }
      if (e.code === "KeyD" && (e.metaKey || e.ctrlKey) && selectedIds.length > 0) {
        e.preventDefault();
        duplicateSelected();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceHeld(false);
      if (!e.metaKey && !e.ctrlKey) setIsCmdHeld(false);
    };

    // Prevent native browser context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    onMouseUp,
    selectedIds,
    deleteSelected,
    duplicateSelected,
    setIsSpaceHeld,
    setActiveTool,
    clearSelection,
  ]);

  // Check if hovered handle is a corner (for rotation)
  const isCornerHandle =
    hoveredHandle === "nw" || hoveredHandle === "ne" || hoveredHandle === "se" || hoveredHandle === "sw";

  const cursor = isPanning
    ? "grabbing"
    : isRotating
      ? getRotationCursorForHandle(activeRotationHandle)
      : isResizing
        ? getCursorForHandle(activeResizeHandle)
        : isDragging
          ? "move"
          : isCmdHeld && selectedIds.length > 0 && isCornerHandle
            ? getRotationCursorForHandle(hoveredHandle)
            : hoveredHandle
              ? getCursorForHandle(hoveredHandle)
              : isSpaceHeld || activeTool === "pan"
                ? "grab"
                : activeTool === "zoom"
                  ? "zoom-in"
                  : "default";

  // Calculate bounding box and rotation for selected shapes
  const selectionInfo = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length === 0) return null;

    // For single shape, use its actual bounds and rotation
    if (selectedShapes.length === 1) {
      const shape = selectedShapes[0];
      return {
        bounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
        rotation: shape.rotation,
      };
    }

    // For multiple shapes, calculate axis-aligned bounding box (no rotation)
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const shape of selectedShapes) {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    }

    return {
      bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      rotation: 0,
    };
  }, [selectedIds, shapes]);

  return (
    <div ref={containerRef} className="relative h-screen w-full select-none overflow-hidden" style={{ cursor }}>
      <CanvasContextMenu onContextMenu={handleContextMenu}>
        <canvas ref={canvasRef} className="h-full w-full" />
      </CanvasContextMenu>

      {selectionInfo && (
        <DimensionLabel bounds={selectionInfo.bounds} transform={transform} rotation={selectionInfo.rotation} />
      )}

      <CanvasMenubar />
      <CanvasToolbar />
    </div>
  );
}
