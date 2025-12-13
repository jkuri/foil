import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCanvasStore } from "@/store";

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function CanvasContextMenu({ children, onContextMenu }: CanvasContextMenuProps) {
  const contextMenuTarget = useCanvasStore((s) => s.contextMenuTarget);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const addShape = useCanvasStore((s) => s.addShape);
  const resetView = useCanvasStore((s) => s.resetView);
  const zoomTo = useCanvasStore((s) => s.zoomTo);

  const handleAddRect = () => {
    const colors: [number, number, number, number][] = [
      [0.4, 0.6, 1, 1],
      [1, 0.5, 0.3, 1],
      [0.5, 0.9, 0.5, 1],
      [0.9, 0.4, 0.8, 1],
      [0.3, 0.8, 0.8, 1],
    ];
    addShape({
      id: crypto.randomUUID(),
      type: "rect",
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 100 + Math.random() * 100,
      height: 80 + Math.random() * 80,
      rotation: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="absolute inset-0" onContextMenu={onContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuTarget ? (
          <>
            <ContextMenuItem onClick={duplicateSelected}>
              Duplicate <ContextMenuShortcut>⌘D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => bringToFront(contextMenuTarget.id)}>Bring to Front</ContextMenuItem>
            <ContextMenuItem onClick={() => sendToBack(contextMenuTarget.id)}>Send to Back</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={deleteSelected} className="text-red-600">
              Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={handleAddRect}>Add Rectangle</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={resetView}>Fit to Screen</ContextMenuItem>
            <ContextMenuItem onClick={() => zoomTo(1)}>Zoom to 100%</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
