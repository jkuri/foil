import { memo, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/store";
import type { CanvasElement, GroupElement } from "@/types";

// Minimal SVG icons
const EyeIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="size-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="size-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const FolderIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const RectIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

const EllipseIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const LineIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const PathIcon = () => (
  <svg
    className="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15.7 4C18.87 6.8 21 10.8 21 15a9 9 0 0 1-18 0c0-4.2 2.13-8.2 5.3-11" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);

const LayersIcon = () => (
  <svg
    className="size-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

interface LayerItemProps {
  element: CanvasElement;
  allElements: CanvasElement[];
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string, multiSelect: boolean) => void;
  onToggleExpand: (id: string) => void;
}

const LayerItem = memo(
  ({ element, allElements, depth, isSelected, isExpanded, onSelect, onToggleExpand }: LayerItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(element.name);

    const setElementVisibility = useCanvasStore((s) => s.setElementVisibility);
    const renameElement = useCanvasStore((s) => s.renameElement);
    const updateElement = useCanvasStore((s) => s.updateElement);

    const isGroup = element.type === "group";
    const isVisible = element.visible !== false;
    const isLocked = element.locked === true;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(element.id, e.shiftKey || e.metaKey);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditName(element.name);
    };

    const handleRename = () => {
      if (editName.trim() && editName !== element.name) {
        renameElement(element.id, editName.trim());
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setEditName(element.name);
        setIsEditing(false);
      }
    };

    const handleToggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand(element.id);
    };

    const handleToggleVisibility = (e: React.MouseEvent) => {
      e.stopPropagation();
      setElementVisibility(element.id, !isVisible);
    };

    const handleToggleLock = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateElement(element.id, { locked: !isLocked });
    };

    // Get the right icon for the element type
    const getTypeIcon = () => {
      switch (element.type) {
        case "rect":
          return <RectIcon />;
        case "ellipse":
          return <EllipseIcon />;
        case "line":
          return <LineIcon />;
        case "path":
          return <PathIcon />;
        case "group":
          return <FolderIcon />;
        default:
          return <RectIcon />;
      }
    };

    return (
      <>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "group flex h-7 cursor-pointer items-center pr-2 text-sm transition-colors",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
          style={{ paddingLeft: depth * 12 + 8 }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(element.id, e.shiftKey || e.metaKey);
            }
          }}
        >
          {/* Expand/collapse button for groups */}
          <div className="flex w-4 shrink-0 items-center justify-center">
            {isGroup && (
              <button
                type="button"
                className="flex size-4 items-center justify-center rounded-sm hover:bg-muted-foreground/20"
                onClick={handleToggleExpand}
              >
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>
            )}
          </div>

          {/* Type icon */}
          <span className={cn("mr-2 shrink-0 opacity-70", isSelected && "opacity-100")}>{getTypeIcon()}</span>

          {/* Name */}
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="h-6 flex-1 px-1 text-xs"
              autoFocus
            />
          ) : (
            <span className="flex-1 truncate font-medium text-xs">{element.name}</span>
          )}

          {/* Action buttons (shown on hover or if locked/hidden) */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
              (!isVisible || isLocked) && "opacity-100",
            )}
          >
            <button
              type="button"
              className={cn(
                "flex size-5 items-center justify-center rounded-sm hover:bg-muted-foreground/20",
                !isVisible && "text-muted-foreground",
              )}
              onClick={handleToggleVisibility}
              title={isVisible ? "Hide" : "Show"}
            >
              {isVisible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
            <button
              type="button"
              className={cn(
                "flex size-5 items-center justify-center rounded-sm hover:bg-muted-foreground/20",
                isLocked && "text-muted-foreground",
              )}
              onClick={handleToggleLock}
              title={isLocked ? "Unlock" : "Lock"}
            >
              {isLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
          </div>
        </div>

        {/* Render children if group is expanded */}
        {isGroup && isExpanded && (
          <div>
            {(element as GroupElement).childIds.map((childId) => {
              const child = allElements.find((e) => e.id === childId);
              if (!child) return null;

              // Determine if child is selected/expanded (passed from parent or store?
              // We need access to these for children.
              // To avoid context overhead, we can access store here or better:
              // Since 'LayerItem' is memoized, we need to pass these props carefully.
              // But 'allElements.find' makes it depend on 'allElements'.
              // If 'allElements' changes (drag), this re-renders.
              // We need to construct the tree properly or accept that children re-render.
              // However, since we memoize LayerItem, if 'child' object reference changes (it does on drag), it re-renders.
              // We need the custom comparator to ignore position changes.

              // We need to pass the props for the child item
              // Since we are inside the parent implementation, we can't easily memoize the children *list* generation
              // without calculating it outside.

              // Let's pass the store access down or use a wrapper.
              // Ideally, the parent component handles the map.
              return (
                <LayerItemWrapper
                  key={childId}
                  elementId={childId}
                  allElements={allElements}
                  depth={depth + 1}
                  onSelect={onSelect}
                  onToggleExpand={onToggleExpand}
                />
              );
            })}
          </div>
        )}
      </>
    );
  },
  (prev, next) => {
    // Custom Comparator to ignore non-visual updates (x,y)
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isExpanded !== next.isExpanded) return false;
    if (prev.depth !== next.depth) return false;

    const p = prev.element;
    const n = next.element;

    if (p.id !== n.id) return false;
    if (p.name !== n.name) return false;
    if (p.visible !== n.visible) return false;
    if (p.locked !== n.locked) return false;
    if (p.type !== n.type) return false;

    // specific checks per type if needed (e.g., text content)

    // For groups, check childIds length/content equality
    if (p.type === "group" && n.type === "group") {
      const pg = p as GroupElement;
      const ng = n as GroupElement;
      if (pg.childIds !== ng.childIds) {
        // reference check usually sufficient if immutable
        if (pg.childIds.length !== ng.childIds.length) return false;
        // Deep check if needed, but normally ref check works for array if replaced
        for (let i = 0; i < pg.childIds.length; i++) {
          if (pg.childIds[i] !== ng.childIds[i]) return false;
        }
      }
    }

    // Ignore x, y, width, height, rotation, opacity, fill, stroke
    return true;
  },
);

// Wrapper to connect store state to LayerItem props correctly
// enabling the Memoization to work effectively.
const LayerItemWrapper = ({
  elementId,
  allElements,
  depth,
  onSelect,
  onToggleExpand,
}: {
  elementId: string;
  allElements: CanvasElement[];
  depth: number;
  onSelect: (id: string, multiSelect: boolean) => void;
  onToggleExpand: (id: string) => void;
}) => {
  const element = allElements.find((e) => e.id === elementId);
  const isSelected = useCanvasStore((s) => s.selectedIds.includes(elementId));
  const isExpanded = useCanvasStore((s) => s.expandedGroupIds.includes(elementId));

  if (!element) return null;

  return (
    <LayerItem
      element={element}
      allElements={allElements}
      depth={depth}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={onSelect}
      onToggleExpand={onToggleExpand}
    />
  );
};

export function LayersPanel() {
  const elements = useCanvasStore((s) => s.elements);

  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const toggleGroupExpanded = useCanvasStore((s) => s.toggleGroupExpanded);

  // Filter to top-level elements (no parent)
  const topLevelElements = useMemo(() => elements.filter((e) => !e.parentId), [elements]);

  const handleSelect = (id: string, multiSelect: boolean) => {
    if (multiSelect) {
      toggleSelection(id);
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <>
      <div className="flex h-10 items-center justify-between border-b bg-muted/30 px-3">
        <div className="flex items-center gap-2">
          <LayersIcon />
          <h3 className="font-medium text-sm">Layers</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-2">
          {topLevelElements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-xs">
              <p>No layers</p>
              <p className="mt-1 opacity-50">Add a shape to start</p>
            </div>
          ) : (
            // Render in reverse order (top layer first)
            [...topLevelElements]
              .reverse()
              .map((element) => (
                <LayerItemWrapper
                  key={element.id}
                  elementId={element.id}
                  allElements={elements}
                  depth={0}
                  onSelect={handleSelect}
                  onToggleExpand={toggleGroupExpanded}
                />
              ))
          )}
        </div>
      </div>
    </>
  );
}
