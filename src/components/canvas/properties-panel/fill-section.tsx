import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ColorInput } from "@/components/shared/color-input";
import { type FillType, FillTypeSelector } from "@/components/shared/fill-type-selector";
import { GradientPicker } from "@/components/shared/gradient-picker";
import { Button } from "@/components/ui/button";
import { createDefaultLinearGradient, createDefaultRadialGradient } from "@/lib/gradient-utils";
import { useCanvasStore } from "@/store";
import type { Fill, LinearGradient, RadialGradient, Shape } from "@/types";
import { SectionHeader } from "./shared";

interface FillSectionProps {
  elements: Shape[];
}

function getFillType(fill: Fill, gradients: Map<string, LinearGradient | RadialGradient>): FillType {
  if (fill === null) return "solid";
  if (typeof fill === "string") return "solid";
  if (fill.type === "gradient") {
    const gradient = gradients.get(fill.ref);
    if (gradient?.type === "radialGradient") return "radial";
    return "linear";
  }
  return "solid";
}

function getDisplayColor(fill: Fill): string {
  if (fill === null) return "#000000";
  if (typeof fill === "string") return fill;
  return "#000000";
}

export function FillSection({ elements }: FillSectionProps) {
  const updateElements = useCanvasStore((s) => s.updateElements);
  const gradients = useCanvasStore((s) => s.gradients);
  const addGradient = useCanvasStore((s) => s.addGradient);
  const updateGradient = useCanvasStore((s) => s.updateGradient);

  if (elements.length === 0) {
    return null;
  }

  const firstElement = elements[0];
  const hasFill = elements.some((e) => e.fill !== null);

  const uniqueFills = new Set(
    elements.map((e) => {
      if (typeof e.fill === "string") return e.fill;
      if (e.fill === null) return "null";
      return `ref:${e.fill.ref}`;
    }),
  );
  const hasMultipleValues = uniqueFills.size > 1;

  const fillType = getFillType(firstElement.fill, gradients);
  const displayFill = firstElement.fill;
  const currentGradient =
    displayFill && typeof displayFill === "object" && displayFill.type === "gradient" ? gradients.get(displayFill.ref) : null;

  const handleAddFill = () => {
    const updates = new Map<string, Record<string, unknown>>();
    elements.forEach((element) => {
      if (!element.fill) {
        updates.set(element.id, { fill: "#000000" });
      }
    });
    if (updates.size > 0) updateElements(updates);
  };

  const handleRemoveFill = () => {
    const updates = new Map<string, Record<string, unknown>>();
    elements.forEach((element) => {
      updates.set(element.id, { fill: null });
    });
    updateElements(updates);
  };

  const handleColorChange = (hex: string, newOpacity?: number) => {
    const updates = new Map<string, Record<string, unknown>>();
    elements.forEach((element) => {
      updates.set(element.id, {
        fill: hex,
        ...(newOpacity !== undefined && { fillOpacity: newOpacity }),
      });
    });
    updateElements(updates);
  };

  const handleFillTypeChange = (type: FillType) => {
    if (type === "solid") {
      const color = currentGradient?.stops[0]?.color || "#000000";
      const updates = new Map<string, Record<string, unknown>>();
      elements.forEach((element) => {
        updates.set(element.id, { fill: color });
      });
      updateElements(updates);
    } else {
      const newGradient = type === "linear" ? createDefaultLinearGradient() : createDefaultRadialGradient();

      if (typeof displayFill === "string") {
        newGradient.stops[0].color = displayFill;
      }

      const gradientId = addGradient(newGradient);

      const updates = new Map<string, Record<string, unknown>>();
      elements.forEach((element) => {
        updates.set(element.id, { fill: { ref: gradientId, type: "gradient" } });
      });
      updateElements(updates);
    }
  };

  const handleGradientChange = (gradient: LinearGradient | RadialGradient) => {
    if (displayFill && typeof displayFill === "object" && displayFill.type === "gradient") {
      updateGradient(displayFill.ref, gradient);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <SectionHeader title="Fill" />
        <Button size="icon" variant="ghost" className="h-4 w-4 text-muted-foreground hover:text-foreground" onClick={handleAddFill}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
        </Button>
      </div>

      {hasFill && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FillTypeSelector value={fillType} onChange={handleFillTypeChange} className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleRemoveFill}
            >
              <HugeiconsIcon icon={MinusSignIcon} className="size-3.5" />
            </Button>
          </div>

          {fillType === "solid" && (
            <ColorInput
              value={getDisplayColor(displayFill)}
              opacity={firstElement.fillOpacity ?? 1}
              isMixed={hasMultipleValues}
              onChange={handleColorChange}
            />
          )}

          {(fillType === "linear" || fillType === "radial") && currentGradient && (
            <GradientPicker gradient={currentGradient} onChange={handleGradientChange} />
          )}
        </div>
      )}
    </div>
  );
}
