import { useCallback, useEffect, useRef, useState } from "react";
import { type EditablePoint, getPointsBounds, parsePathToEditable, stringifyEditablePath } from "@/lib/path-editor-utils";
import { useCanvasStore } from "@/store";

type DragTarget = { type: "anchor"; index: number } | { type: "handleIn"; index: number } | { type: "handleOut"; index: number };

const rotatePointAroundCenter = (x: number, y: number, cx: number, cy: number, rad: number) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;

  return {
    x: dx * cos - dy * sin + cx,
    y: dx * sin + dy * cos + cy,
  };
};

export function usePathEditor(screenToWorld: (x: number, y: number) => { x: number; y: number }) {
  const editingPathId = useCanvasStore((s) => s.editingPathId);
  const selectedPointIndices = useCanvasStore((s) => s.selectedPointIndices);
  const setSelectedPointIndices = useCanvasStore((s) => s.setSelectedPointIndices);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [editablePoints, setEditablePoints] = useState<EditablePoint[]>([]);

  const elementTransformRef = useRef({ rotation: 0, cx: 0, cy: 0, offsetX: 0, offsetY: 0 });

  const pathElement = useCanvasStore((s) => s.elements.find((e) => e.id === editingPathId));

  const syncFromStore = useCallback(() => {
    if (!editingPathId || !pathElement || pathElement.type !== "path") {
      setEditablePoints([]);
      return;
    }

    const el = pathElement;

    const cx = el.bounds.x + el.bounds.width / 2;
    const cy = el.bounds.y + el.bounds.height / 2;
    const rad = el.rotation || 0;

    const rawPoints = parsePathToEditable(el.d);

    const rawBounds = getPointsBounds(rawPoints);
    const offsetX = el.bounds.x - rawBounds.x;
    const offsetY = el.bounds.y - rawBounds.y;

    elementTransformRef.current = { rotation: rad, cx, cy, offsetX, offsetY };

    const worldPoints = rawPoints.map((p) => {
      const ox = p.x + offsetX;
      const oy = p.y + offsetY;

      const rotated = rotatePointAroundCenter(ox, oy, cx, cy, rad);

      const wp: EditablePoint = {
        ...p,
        x: rotated.x,
        y: rotated.y,
      };

      if (p.handleIn) {
        const hox = p.handleIn.x + offsetX;
        const hoy = p.handleIn.y + offsetY;
        const rh = rotatePointAroundCenter(hox, hoy, cx, cy, rad);
        wp.handleIn = { x: rh.x, y: rh.y };
      }
      if (p.handleOut) {
        const hox = p.handleOut.x + offsetX;
        const hoy = p.handleOut.y + offsetY;
        const rh = rotatePointAroundCenter(hox, hoy, cx, cy, rad);
        wp.handleOut = { x: rh.x, y: rh.y };
      }
      return wp;
    });

    setEditablePoints(worldPoints);
  }, [editingPathId, pathElement]);

  useEffect(() => {
    syncFromStore();
  }, [syncFromStore]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragTarget["type"], index: number) => {
      e.stopPropagation();
      setDragTarget({ type, index });

      if (type === "anchor") {
        if (e.shiftKey) {
          setSelectedPointIndices(
            selectedPointIndices.includes(index) ? selectedPointIndices.filter((i) => i !== index) : [...selectedPointIndices, index],
          );
        } else {
          if (!selectedPointIndices.includes(index)) {
            setSelectedPointIndices([index]);
          }
        }
      }
    },
    [selectedPointIndices, setSelectedPointIndices],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragTarget || !editingPathId) return;

      const { x, y } = screenToWorld(e.clientX, e.clientY);

      setEditablePoints((currentPoints) => {
        const newPoints = [...currentPoints];
        const point = { ...newPoints[dragTarget.index] };

        if (dragTarget.type === "anchor") {
          const dx = x - point.x;
          const dy = y - point.y;

          point.x = x;
          point.y = y;

          if (point.handleIn) {
            point.handleIn = { x: point.handleIn.x + dx, y: point.handleIn.y + dy };
          }
          if (point.handleOut) {
            point.handleOut = { x: point.handleOut.x + dx, y: point.handleOut.y + dy };
          }

          newPoints[dragTarget.index] = point;

          if (selectedPointIndices.includes(dragTarget.index)) {
            selectedPointIndices.forEach((idx) => {
              if (idx === dragTarget.index) return;
              const p = { ...newPoints[idx] };
              p.x += dx;
              p.y += dy;
              if (p.handleIn) p.handleIn = { x: p.handleIn.x + dx, y: p.handleIn.y + dy };
              if (p.handleOut) p.handleOut = { x: p.handleOut.x + dx, y: p.handleOut.y + dy };
              newPoints[idx] = p;
            });
          }
        } else if (dragTarget.type === "handleIn") {
          point.handleIn = { x, y };
          newPoints[dragTarget.index] = point;
        } else if (dragTarget.type === "handleOut") {
          point.handleOut = { x, y };
          newPoints[dragTarget.index] = point;
        }

        const { rotation: rad, cx, cy } = elementTransformRef.current;
        const negRad = -rad;

        const localPoints = newPoints.map((p) => {
          const rotated = rotatePointAroundCenter(p.x, p.y, cx, cy, negRad);

          const lp: EditablePoint = {
            ...p,
            x: rotated.x,
            y: rotated.y,
          };

          if (p.handleIn) {
            const rh = rotatePointAroundCenter(p.handleIn.x, p.handleIn.y, cx, cy, negRad);
            lp.handleIn = { x: rh.x, y: rh.y };
          }
          if (p.handleOut) {
            const rh = rotatePointAroundCenter(p.handleOut.x, p.handleOut.y, cx, cy, negRad);
            lp.handleOut = { x: rh.x, y: rh.y };
          }
          return lp;
        });

        const d = stringifyEditablePath(localPoints);

        const newRawBounds = getPointsBounds(localPoints);

        updateElement(editingPathId, {
          d,
          bounds: {
            x: newRawBounds.x,
            y: newRawBounds.y,
            width: newRawBounds.width,
            height: newRawBounds.height,
          },
        });

        return newPoints;
      });
    },
    [dragTarget, editingPathId, screenToWorld, updateElement, selectedPointIndices],
  );

  const handleMouseUp = useCallback(() => {
    setDragTarget(null);
  }, []);

  return {
    editablePoints,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
