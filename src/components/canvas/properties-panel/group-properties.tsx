import { NumberInput } from "@/components/shared/number-input";
import { Separator } from "@/components/ui/separator";
import { getGroupBounds, moveGroupChildren, resizeElementInGroup, rotateGroupChildren } from "@/lib/group-utils";
import { useCanvasStore } from "@/store";
import type { GroupElement } from "@/types";
import { DimensionsSection } from "./dimensions-section";
import { ExportSection } from "./export-section";
import { RotateIcon, SectionHeader } from "./shared";

interface GroupPropertiesProps {
  element: GroupElement;
}

export function GroupProperties({ element }: GroupPropertiesProps) {
  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const updateElements = useCanvasStore((s) => s.updateElements);

  const bounds = getGroupBounds(element, elements);

  const handleXChange = (newX: number) => {
    const dx = newX - bounds.x;
    const updates = moveGroupChildren(element, dx, 0, elements);
    if (updates.size > 0) updateElements(updates);
  };

  const handleYChange = (newY: number) => {
    const dy = newY - bounds.y;
    const updates = moveGroupChildren(element, 0, dy, elements);
    if (updates.size > 0) updateElements(updates);
  };

  const handleDimensionsUpdate = (id: string, updates: Record<string, unknown>) => {
    if ("aspectRatioLocked" in updates && Object.keys(updates).length === 1) {
      updateElement(id, updates);
      return;
    }

    if (bounds.width === 0 || bounds.height === 0) return;

    let newWidth = bounds.width;
    let newHeight = bounds.height;
    const newX = bounds.x;
    const newY = bounds.y;

    if ("width" in updates) {
      newWidth = Math.max(0.1, updates.width as number);
    }

    if ("height" in updates) {
      newHeight = Math.max(0.1, updates.height as number);
    }

    const newBounds = { x: newX, y: newY, width: newWidth, height: newHeight };
    const oldBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };

    const elementUpdates = new Map<string, Record<string, unknown>>();

    const traverse = (ids: string[]) => {
      for (const childId of ids) {
        const el = elements.find((e) => e.id === childId);
        if (!el) continue;

        if (el.type === "group") {
          traverse(el.childIds);
        } else {
          resizeElementInGroup(el, oldBounds, newBounds, elementUpdates);
        }
      }
    };

    traverse(element.childIds);
    if (elementUpdates.size > 0) updateElements(elementUpdates);
  };

  return (
    <div className="flex h-full flex-col gap-0 text-foreground text-xs">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3 font-medium">
        <span className="truncate">{element.name}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-2">
        <div className="flex flex-col gap-2">
          <SectionHeader title="Position" />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={bounds.x} onChange={handleXChange} />
            <NumberInput label="Y" value={bounds.y} onChange={handleYChange} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              icon={<RotateIcon />}
              value={(element.rotation * 180) / Math.PI}
              onChange={(v) => {
                const newRotation = (v * Math.PI) / 180;
                const deltaRotation = newRotation - element.rotation;

                const groupCenterX = bounds.x + bounds.width / 2;
                const groupCenterY = bounds.y + bounds.height / 2;

                const updates = rotateGroupChildren(element, deltaRotation, groupCenterX, groupCenterY, elements);

                updates.set(element.id, { rotation: newRotation });
                updateElements(updates);
              }}
            />
          </div>
        </div>

        <Separator />

        <DimensionsSection
          element={element}
          updateElement={handleDimensionsUpdate}
          bounds={{ width: bounds.width, height: bounds.height }}
        />

        <Separator />

        <div className="flex flex-col gap-3 p-3">
          <SectionHeader title="Appearance" />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-[10px] text-muted-foreground uppercase">Opacity</span>
              <NumberInput
                value={(element.opacity ?? 1) * 100}
                onChange={(v) => updateElement(element.id, { opacity: v / 100 })}
                step={1}
              />
            </div>
          </div>
        </div>

        <Separator />

        <ExportSection element={element} />
      </div>
    </div>
  );
}
