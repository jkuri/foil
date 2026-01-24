import { useCallback, useEffect, useRef, useState } from "react";
import type { GradientStop, LinearGradient, RadialGradient } from "@/types";
import { addStopAtPosition, gradientToCSS, removeStop, sortStopsByOffset } from "@/lib/gradient-utils";
import { cn } from "@/lib/utils";

interface GradientStopEditorProps {
  gradient: LinearGradient | RadialGradient;
  selectedStopIndex: number;
  onStopsChange: (stops: GradientStop[]) => void;
  onSelectStop: (index: number) => void;
  className?: string;
}

export function GradientStopEditor({ gradient, selectedStopIndex, onStopsChange, onSelectStop, className }: GradientStopEditorProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  const sortedStops = sortStopsByOffset(gradient.stops);

  const handleBarClick = useCallback(
    (e: React.MouseEvent) => {
      if (!barRef.current || draggingIndex !== null) return;

      const target = e.target as HTMLElement;
      if (target.closest("[data-stop-handle]")) return;

      const rect = barRef.current.getBoundingClientRect();
      const offset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      const newStops = addStopAtPosition(gradient.stops, offset);
      onStopsChange(newStops);

      const newIndex = sortStopsByOffset(newStops).findIndex((s) => Math.abs(s.offset - offset) < 0.01);
      if (newIndex !== -1) {
        onSelectStop(newIndex);
      }
    },
    [gradient.stops, onStopsChange, onSelectStop, draggingIndex],
  );

  const handleStopMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      setDraggingIndex(index);
      setDragStartY(e.clientY);
      onSelectStop(index);
    },
    [onSelectStop],
  );

  const handleStopDoubleClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (gradient.stops.length <= 2) return;

      const newStops = removeStop(sortedStops, index);
      onStopsChange(newStops);

      const newSelectedIndex = Math.min(index, newStops.length - 1);
      onSelectStop(newSelectedIndex);
    },
    [gradient.stops, sortedStops, onStopsChange, onSelectStop],
  );

  useEffect(() => {
    if (draggingIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current || draggingIndex === null) return;

      const rect = barRef.current.getBoundingClientRect();
      const offset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      const newStops = sortedStops.map((stop, i) => (i === draggingIndex ? { ...stop, offset } : stop));

      onStopsChange(newStops);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragStartY !== null && draggingIndex !== null) {
        const deltaY = Math.abs(e.clientY - dragStartY);
        if (deltaY > 50 && gradient.stops.length > 2) {
          const newStops = removeStop(sortedStops, draggingIndex);
          onStopsChange(newStops);
          const newSelectedIndex = Math.min(draggingIndex, newStops.length - 1);
          onSelectStop(newSelectedIndex);
        } else {
          const finalStops = sortStopsByOffset(sortedStops);
          const currentStop = sortedStops[draggingIndex];
          if (currentStop) {
            const newIndex = finalStops.findIndex((s) => s === currentStop || Math.abs(s.offset - currentStop.offset) < 0.001);
            if (newIndex !== -1 && newIndex !== draggingIndex) {
              onSelectStop(newIndex);
            }
          }
        }
      }

      setDraggingIndex(null);
      setDragStartY(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingIndex, dragStartY, sortedStops, gradient.stops.length, onStopsChange, onSelectStop]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        ref={barRef}
        className="relative h-6 cursor-crosshair overflow-visible rounded-md border shadow-inner"
        style={{ background: gradientToCSS(gradient) }}
        onClick={handleBarClick}
      >
        {sortedStops.map((stop, index) => (
          <div
            key={index}
            data-stop-handle
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm border-2 shadow-md transition-transform",
              index === selectedStopIndex ? "z-10 scale-110 border-primary ring-2 ring-primary/30" : "border-white",
              draggingIndex === index && "cursor-grabbing",
            )}
            style={{
              left: `${stop.offset * 100}%`,
              backgroundColor: stop.color,
            }}
            onMouseDown={(e) => handleStopMouseDown(e, index)}
            onDoubleClick={(e) => handleStopDoubleClick(e, index)}
          />
        ))}
      </div>
      <div className="flex justify-between px-1 text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>Click to add stop</span>
        <span>100%</span>
      </div>
    </div>
  );
}
