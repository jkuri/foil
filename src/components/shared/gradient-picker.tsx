import { useState } from "react";
import { ColorPicker } from "@/components/shared/color-picker";
import { GradientStopEditor } from "@/components/shared/gradient-stop-editor";
import { NumberInput } from "@/components/shared/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  angleToGradientCoords,
  gradientCoordsToAngle,
  gradientToCSS,
  isLinearGradient,
  sortStopsByOffset,
  updateStop,
} from "@/lib/gradient-utils";
import { cn } from "@/lib/utils";
import type { GradientStop, LinearGradient, RadialGradient } from "@/types";

interface GradientPickerProps {
  gradient: LinearGradient | RadialGradient;
  onChange: (gradient: LinearGradient | RadialGradient) => void;
  className?: string;
}

export function GradientPicker({ gradient, onChange, className }: GradientPickerProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);

  const sortedStops = sortStopsByOffset(gradient.stops);
  const selectedStop = sortedStops[selectedStopIndex] || sortedStops[0];

  const handleStopsChange = (stops: GradientStop[]) => {
    onChange({ ...gradient, stops });
  };

  const handleStopColorChange = (color: string, opacity?: number) => {
    const newStops = updateStop(sortedStops, selectedStopIndex, {
      color,
      ...(opacity !== undefined && { opacity }),
    });
    onChange({ ...gradient, stops: newStops });
  };

  const handleAngleChange = (angle: number) => {
    if (!isLinearGradient(gradient)) return;
    const clampedAngle = ((angle % 360) + 360) % 360;
    const coords = angleToGradientCoords(clampedAngle);
    onChange({ ...gradient, ...coords });
  };

  const handlePositionChange = (offset: number) => {
    const clampedOffset = Math.max(0, Math.min(100, offset)) / 100;
    const newStops = updateStop(sortedStops, selectedStopIndex, { offset: clampedOffset });
    onChange({ ...gradient, stops: newStops });
  };

  const currentAngle = isLinearGradient(gradient) ? gradientCoordsToAngle(gradient.x1, gradient.y1, gradient.x2, gradient.y2) : 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="h-12 w-full rounded-md border shadow-inner" style={{ background: gradientToCSS(gradient) }} />

      <GradientStopEditor
        gradient={gradient}
        selectedStopIndex={selectedStopIndex}
        onStopsChange={handleStopsChange}
        onSelectStop={setSelectedStopIndex}
      />

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm transition-transform hover:scale-105">
            <div className="absolute inset-0" style={{ backgroundColor: selectedStop?.color || "#000000" }} />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
            <ColorPicker
              color={selectedStop?.color || "#000000"}
              onChange={(color) => handleStopColorChange(color)}
              opacity={selectedStop?.opacity ?? 1}
              onOpacityChange={(opacity) => handleStopColorChange(selectedStop?.color || "#000000", opacity)}
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-1 items-center gap-2 text-xs">
          <span className="shrink-0 text-muted-foreground">Position</span>
          <NumberInput
            className="h-7 flex-1"
            value={Math.round((selectedStop?.offset ?? 0) * 100)}
            onChange={handlePositionChange}
            step={1}
            suffix="%"
          />
        </div>
      </div>

      {isLinearGradient(gradient) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="shrink-0 text-muted-foreground">Angle</span>
          <NumberInput className="h-7 flex-1" value={currentAngle} onChange={handleAngleChange} step={15} suffix="°" />
          <div className="flex gap-1">
            {[0, 45, 90, 135, 180].map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => handleAngleChange(angle)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded border text-[10px] transition-colors",
                  currentAngle === angle ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
                )}
              >
                {angle}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLinearGradient(gradient) && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Center X</span>
            <NumberInput
              className="h-7"
              value={Math.round(gradient.cx * 100)}
              onChange={(val) => onChange({ ...gradient, cx: Math.max(0, Math.min(100, val)) / 100 })}
              step={5}
              suffix="%"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Center Y</span>
            <NumberInput
              className="h-7"
              value={Math.round(gradient.cy * 100)}
              onChange={(val) => onChange({ ...gradient, cy: Math.max(0, Math.min(100, val)) / 100 })}
              step={5}
              suffix="%"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Radius</span>
            <NumberInput
              className="h-7"
              value={Math.round(gradient.r * 100)}
              onChange={(val) => onChange({ ...gradient, r: Math.max(10, Math.min(150, val)) / 100 })}
              step={5}
              suffix="%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
