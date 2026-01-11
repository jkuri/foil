import type opentype from "opentype.js";
import { useEffect, useRef } from "react";
import { drawTextWithOpenType, getFont } from "@/lib/text-renderer";
import { useCanvasStore } from "@/store";
import type { TextElement } from "@/types";

interface TextOverlayProps {
  canvasRef: HTMLCanvasElement | null;
  transform: { x: number; y: number; scale: number };
  fontsReady?: boolean;
}

// Cache loaded fonts by their key (supports arrays of fonts for composite handling)
const loadedFonts = new Map<string, opentype.Font[]>();

/**
 * Canvas 2D overlay for rendering text elements
 * Uses OpenType.js for rendering to ensure consistency with outline conversion
 */
export function TextOverlay({ canvasRef, transform, fontsReady = false }: TextOverlayProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const elements = useCanvasStore((s) => s.elements);
  const isEditingText = useCanvasStore((s) => s.isEditingText);
  const editingTextId = useCanvasStore((s) => s.editingTextId);

  useEffect(() => {
    if (!overlayRef.current || !canvasRef || !fontsReady) return;

    let mounted = true;
    const overlay = overlayRef.current;
    const ctx = overlay.getContext("2d")!;

    // Match WebGL canvas size
    const rect = canvasRef.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    overlay.width = rect.width * dpr;
    overlay.height = rect.height * dpr;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    const render = async () => {
      if (!mounted) return;

      // Clear canvas
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // Apply transform BEFORE loop, inside async flow
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const textElements = elements.filter((e) => e.type === "text") as TextElement[];

      for (const textEl of textElements) {
        if (!mounted) break;

        // Skip if this text is being edited (editor will render it)
        if (isEditingText && editingTextId === textEl.id) {
          continue;
        }

        if (textEl.visible === false) continue;

        const { x, y, text, fontSize, fontFamily, fontWeight, fill, opacity, rotation } = textEl;

        // Get font
        const fontKey = `${fontFamily}-${fontWeight || "400"}`;
        let fonts = loadedFonts.get(fontKey);

        if (!fonts) {
          // This await might yield execution. Scope is preserved.
          const loaded = await getFont(fontFamily, fontWeight || "400");
          if (loaded) {
            fonts = loaded;
            loadedFonts.set(fontKey, fonts);
          }
        }

        if (!mounted) break;

        if (!fonts || fonts.length === 0) {
          // Fallback to native text rendering if font loading fails
          ctx.save();
          if (rotation) {
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.translate(-x, -y);
          }
          ctx.font = `${fontWeight || "normal"} ${fontSize}px ${fontFamily}`;
          ctx.textBaseline = "alphabetic";
          ctx.globalAlpha = opacity ?? 1;
          if (fill) {
            ctx.fillStyle = typeof fill === "string" ? fill : "#000000";
            ctx.fillText(text, x, y);
          }
          ctx.restore();
          continue;
        }

        ctx.save();

        // Calculate visual center for rotation (same as webgl-renderer and hit-testing)
        let centerX: number;
        let centerY: number;
        if (textEl.bounds) {
          centerX = x + textEl.bounds.x + textEl.bounds.width / 2;
          centerY = y + textEl.bounds.y + textEl.bounds.height / 2;
        } else {
          // Fallback estimation
          const estWidth = text.length * fontSize * 0.6;
          const estHeight = fontSize * 1.2;
          centerX = x + estWidth / 2;
          centerY = y - fontSize + estHeight / 2;
        }

        // Apply rotation around visual center
        if (rotation) {
          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);
          ctx.translate(-centerX, -centerY);
        }

        ctx.globalAlpha = opacity ?? 1;

        // Draw text using OpenType.js - same as outline conversion!
        const fillColor = fill ? (typeof fill === "string" ? fill : "#000000") : null;

        drawTextWithOpenType(ctx, fonts, text, x, y, fontSize, {
          fill: fillColor,
        });

        ctx.restore();
      }

      // Restore transform
      ctx.restore();
    };

    render();

    return () => {
      mounted = false;
    };
  }, [canvasRef, elements, transform, isEditingText, editingTextId, fontsReady]);

  return (
    <canvas
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
