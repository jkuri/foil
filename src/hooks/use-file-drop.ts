import { useCallback } from "react";
import { getElementBounds } from "@/lib/element-utils";
import { parseSVG, translatePath } from "@/lib/svg-import";
import type { CanvasElement } from "@/types";

interface UseFileDropProps {
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  importElements: (elements: CanvasElement[]) => void;
}

export function useFileDrop({ screenToWorld, importElements }: UseFileDropProps) {
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const isSvg = file.type.includes("svg") || file.name.endsWith(".svg");
      const isImage = file.type.startsWith("image/");

      if (!isSvg && !isImage) return;

      const dropWorld = screenToWorld(e.clientX, e.clientY);

      try {
        if (isSvg) {
          const content = await file.text();
          const importedElements = parseSVG(content);
          if (importedElements.length === 0) return;

          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const el of importedElements) {
            const bounds = getElementBounds(el);
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
          }

          const importedCenterX = (minX + maxX) / 2;
          const importedCenterY = (minY + maxY) / 2;
          const offsetX = dropWorld.x - importedCenterX;
          const offsetY = dropWorld.y - importedCenterY;

          const positionedElements = importedElements.map((el) => {
            if (el.type === "rect" || el.type === "image") {
              return { ...el, x: el.x + offsetX, y: el.y + offsetY };
            }
            if (el.type === "ellipse") {
              return { ...el, cx: el.cx + offsetX, cy: el.cy + offsetY };
            }
            if (el.type === "line") {
              return {
                ...el,
                x1: el.x1 + offsetX,
                y1: el.y1 + offsetY,
                x2: el.x2 + offsetX,
                y2: el.y2 + offsetY,
              };
            }
            if (el.type === "path") {
              return {
                ...el,
                d: translatePath(el.d, offsetX, offsetY),
                bounds: { ...el.bounds, x: el.bounds.x + offsetX, y: el.bounds.y + offsetY },
              };
            }
            if (el.type === "polygon" || el.type === "polyline") {
              return {
                ...el,
                points: el.points.map((pt) => ({ x: pt.x + offsetX, y: pt.y + offsetY })),
              };
            }
            if (el.type === "text") {
              return { ...el, x: el.x + offsetX, y: el.y + offsetY };
            }
            return el;
          });

          importElements(positionedElements);
        } else {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = dataUrl;
          });

          const width = img.naturalWidth;
          const height = img.naturalHeight;

          const imageElement = {
            id: crypto.randomUUID(),
            type: "image" as const,
            name: file.name.replace(/\.[^.]+$/, ""),
            x: dropWorld.x - width / 2,
            y: dropWorld.y - height / 2,
            width,
            height,
            href: dataUrl,
            rotation: 0,
            fill: null,
            stroke: null,
            opacity: 1,
            preserveAspectRatio: "xMidYMid" as const,
            aspectRatioLocked: true,
          };

          importElements([imageElement]);
        }
      } catch (error) {
        console.error("Failed to import dropped file:", error);
      }
    },
    [screenToWorld, importElements],
  );

  return { handleDragOver, handleDrop };
}
