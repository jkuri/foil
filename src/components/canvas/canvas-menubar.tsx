import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { getRandomShapeColorCSS } from "@/lib/colors";
import { useCanvasStore } from "@/store";

export function CanvasMenubar() {
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const elements = useCanvasStore((s) => s.elements);
  const transform = useCanvasStore((s) => s.transform); // Added
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);
  const selectAll = useCanvasStore((s) => s.selectAll);
  const addElement = useCanvasStore((s) => s.addElement);
  const zoomIn = useCanvasStore((s) => s.zoomIn);
  const zoomOut = useCanvasStore((s) => s.zoomOut);
  const zoomTo = useCanvasStore((s) => s.zoomTo);
  const resetView = useCanvasStore((s) => s.resetView);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);

  const getCenter = () => {
    const centerX = (window.innerWidth / 2 - transform.x) / transform.scale;
    const centerY = (window.innerHeight / 2 - transform.y) / transform.scale;
    return { x: centerX, y: centerY };
  };

  const handleAddRect = () => {
    const center = getCenter();
    addElement({
      id: crypto.randomUUID(),
      type: "rect",
      name: `Rectangle ${elements.filter((e) => e.type === "rect").length + 1}`,
      x: center.x - 50,
      y: center.y - 40,
      width: 100,
      height: 80,
      rotation: 0,
      fill: getRandomShapeColorCSS(),
      stroke: null,
      opacity: 1,
    });
  };

  const handleAddEllipse = () => {
    const center = getCenter();
    addElement({
      id: crypto.randomUUID(),
      type: "ellipse",
      name: `Ellipse ${elements.filter((e) => e.type === "ellipse").length + 1}`,
      cx: center.x,
      cy: center.y,
      rx: 50,
      ry: 40,
      rotation: 0,
      fill: getRandomShapeColorCSS(),
      stroke: null,
      opacity: 1,
    });
  };

  const handleAddLine = () => {
    const center = getCenter();
    addElement({
      id: crypto.randomUUID(),
      type: "line",
      name: `Line ${elements.filter((e) => e.type === "line").length + 1}`,
      x1: center.x - 50,
      y1: center.y,
      x2: center.x + 50,
      y2: center.y,
      rotation: 0,
      fill: null,
      stroke: { color: getRandomShapeColorCSS(), width: 2 },
      opacity: 1,
    });
  };

  // Check if any selected element is a group
  const hasGroupSelected = selectedIds.some((id) => {
    const el = elements.find((e) => e.id === id);
    return el?.type === "group";
  });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
      <Menubar className="pointer-events-auto shadow-md">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>New Project</MenubarItem>
            <MenubarItem disabled>Open...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>Export</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={duplicateSelected} disabled={selectedIds.length === 0}>
              Duplicate <MenubarShortcut>⌘D</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={deleteSelected} disabled={selectedIds.length === 0}>
              Delete <MenubarShortcut>⌫</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={selectAll}>
              Select All <MenubarShortcut>⌘A</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={groupSelected} disabled={selectedIds.length < 2}>
              Group <MenubarShortcut>⌘G</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={ungroupSelected} disabled={!hasGroupSelected}>
              Ungroup <MenubarShortcut>⇧⌘G</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Insert</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleAddRect}>Rectangle</MenubarItem>
            <MenubarItem onClick={handleAddEllipse}>Ellipse</MenubarItem>
            <MenubarItem onClick={handleAddLine}>Line</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent className="w-42">
            <MenubarItem onClick={zoomIn}>
              Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={zoomOut}>
              Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => zoomTo(1)}>
              Zoom to 100% <MenubarShortcut>⌘0</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={resetView}>Fit to Screen</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
