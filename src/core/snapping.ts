import type { CanvasElement, SmartGuide } from "@/types";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SnapConfig {
  snapToGrid: boolean;
  snapToObjects: boolean;
  snapToGeometry: boolean;
  gridSize: number;
  threshold: number; // Screen pixels
  scale: number;
}

export interface SnapAdjustment {
  x: number;
  y: number;
  guides: SmartGuide[];
}

// Figma uses 4px snap threshold by default
const FIGMA_SNAP_THRESHOLD = 4;

// ============================================
// BOUNDS UTILITIES
// ============================================

export function getBounds(element: CanvasElement): Bounds {
  if (element.type === "rect") {
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + element.width,
      maxY: element.y + element.height,
      centerX: element.x + element.width / 2,
      centerY: element.y + element.height / 2,
    };
  }
  if (element.type === "ellipse") {
    return {
      minX: element.cx - element.rx,
      minY: element.cy - element.ry,
      maxX: element.cx + element.rx,
      maxY: element.cy + element.ry,
      centerX: element.cx,
      centerY: element.cy,
    };
  }
  if (element.type === "line") {
    const minX = Math.min(element.x1, element.x2);
    const maxX = Math.max(element.x1, element.x2);
    const minY = Math.min(element.y1, element.y2);
    const maxY = Math.max(element.y1, element.y2);
    return {
      minX,
      minY,
      maxX,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }
  if (element.type === "path") {
    return {
      minX: element.bounds.x,
      minY: element.bounds.y,
      maxX: element.bounds.x + element.bounds.width,
      maxY: element.bounds.y + element.bounds.height,
      centerX: element.bounds.x + element.bounds.width / 2,
      centerY: element.bounds.y + element.bounds.height / 2,
    };
  }
  return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 };
}

export function getSnapPoints(element: CanvasElement): Point[] {
  const points: Point[] = [];
  if (element.type === "rect") {
    points.push({ x: element.x, y: element.y });
    points.push({ x: element.x + element.width, y: element.y });
    points.push({ x: element.x + element.width, y: element.y + element.height });
    points.push({ x: element.x, y: element.y + element.height });
  } else if (element.type === "line") {
    points.push({ x: element.x1, y: element.y1 });
    points.push({ x: element.x2, y: element.y2 });
  } else if (element.type === "path") {
    const b = getBounds(element);
    points.push({ x: b.minX, y: b.minY });
    points.push({ x: b.maxX, y: b.minY });
    points.push({ x: b.maxX, y: b.maxY });
    points.push({ x: b.minX, y: b.maxY });
  } else if (element.type === "ellipse") {
    points.push({ x: element.cx, y: element.cy });
    points.push({ x: element.cx, y: element.cy - element.ry });
    points.push({ x: element.cx + element.rx, y: element.cy });
    points.push({ x: element.cx, y: element.cy + element.ry });
    points.push({ x: element.cx - element.rx, y: element.cy });
  }
  return points;
}

// ============================================
// FIGMA-STYLE ALIGNMENT SNAPPING
// ============================================

interface AlignmentSnap {
  adjustment: number;
  distance: number;
  guides: SmartGuide[];
}

function findAlignmentSnaps(
  projected: Bounds,
  candidates: Bounds[],
  snapThreshold: number,
): { snapX: AlignmentSnap; snapY: AlignmentSnap } {
  const { minX, maxX, centerX, minY, maxY, centerY } = projected;

  // X alignment: left edge, center, right edge
  const xPositions = [
    { value: minX, type: "left" as const },
    { value: centerX, type: "center" as const },
    { value: maxX, type: "right" as const },
  ];

  // Y alignment: top edge, center, bottom edge
  const yPositions = [
    { value: minY, type: "top" as const },
    { value: centerY, type: "center" as const },
    { value: maxY, type: "bottom" as const },
  ];

  let bestX: AlignmentSnap = { adjustment: 0, distance: snapThreshold, guides: [] };
  let bestY: AlignmentSnap = { adjustment: 0, distance: snapThreshold, guides: [] };

  for (const b of candidates) {
    const candidateXPositions = [b.minX, b.centerX, b.maxX];
    const candidateYPositions = [b.minY, b.centerY, b.maxY];

    // Check X alignment
    for (const myPos of xPositions) {
      for (const targetX of candidateXPositions) {
        const dist = targetX - myPos.value;
        const absDist = Math.abs(dist);
        if (absDist < bestX.distance) {
          // Figma extends guides to connect objects
          const guideY1 = Math.min(minY, b.minY);
          const guideY2 = Math.max(maxY, b.maxY);

          const guides: SmartGuide[] = [
            {
              type: "alignment",
              axis: "x",
              position: targetX,
              x1: targetX,
              y1: guideY1,
              x2: targetX,
              y2: guideY2,
            },
          ];

          // Add center marker if snapping to center
          if (myPos.type === "center") {
            guides.push({
              type: "center",
              cx: targetX,
              cy: centerY + dist,
            });
          }

          bestX = { adjustment: dist, distance: absDist, guides };
        }
      }
    }

    // Check Y alignment
    for (const myPos of yPositions) {
      for (const targetY of candidateYPositions) {
        const dist = targetY - myPos.value;
        const absDist = Math.abs(dist);
        if (absDist < bestY.distance) {
          const guideX1 = Math.min(minX, b.minX);
          const guideX2 = Math.max(maxX, b.maxX);

          const guides: SmartGuide[] = [
            {
              type: "alignment",
              axis: "y",
              position: targetY,
              x1: guideX1,
              y1: targetY,
              x2: guideX2,
              y2: targetY,
            },
          ];

          if (myPos.type === "center") {
            guides.push({
              type: "center",
              cx: centerX + bestX.adjustment,
              cy: targetY,
            });
          }

          bestY = { adjustment: dist, distance: absDist, guides };
        }
      }
    }
  }

  return { snapX: bestX, snapY: bestY };
}

// ============================================
// FIGMA-STYLE GAP/DISTRIBUTION SNAPPING
// ============================================

interface SpacingSnap {
  adjustment: number;
  distance: number;
  guides: SmartGuide[];
}

function findSpacingSnaps(
  projected: Bounds,
  candidates: Bounds[],
  snapThreshold: number,
): { snapX: SpacingSnap; snapY: SpacingSnap } {
  const { minX, maxX, minY, maxY } = projected;
  const draggedWidth = maxX - minX;
  const draggedHeight = maxY - minY;

  let bestX: SpacingSnap = { adjustment: 0, distance: snapThreshold * 2, guides: [] };
  let bestY: SpacingSnap = { adjustment: 0, distance: snapThreshold * 2, guides: [] };

  // X-Axis: Find horizontal neighbors
  const candidatesInY = candidates.filter((c) => c.maxY > minY && c.minY < maxY);
  candidatesInY.sort((a, b) => a.minX - b.minX);

  let leftNeighbor: Bounds | null = null;
  let rightNeighbor: Bounds | null = null;

  for (const c of candidatesInY) {
    if (c.maxX < minX) leftNeighbor = c;
    if (c.minX > maxX && !rightNeighbor) {
      rightNeighbor = c;
      break;
    }
  }

  // Equal distribution: Left ... [gap] ... Me ... [gap] ... Right
  if (leftNeighbor && rightNeighbor) {
    const totalSpace = rightNeighbor.minX - leftNeighbor.maxX;
    const targetGap = (totalSpace - draggedWidth) / 2;
    const targetX = leftNeighbor.maxX + targetGap;
    const snapDiff = targetX - minX;

    if (Math.abs(snapDiff) < snapThreshold * 2) {
      const finalGap = Math.round(targetGap);
      const centerY = (minY + maxY) / 2;

      const guides: SmartGuide[] = [
        // Left gap
        {
          type: "spacing",
          x1: leftNeighbor.maxX,
          y1: centerY,
          x2: targetX,
          y2: centerY,
          label: `${finalGap}`,
        },
        // Right gap
        {
          type: "spacing",
          x1: targetX + draggedWidth,
          y1: centerY,
          x2: rightNeighbor.minX,
          y2: centerY,
          label: `${finalGap}`,
        },
      ];

      bestX = { adjustment: snapDiff, distance: Math.abs(snapDiff), guides };
    }
  }

  // Y-Axis: Find vertical neighbors
  const candidatesInX = candidates.filter((c) => c.maxX > minX && c.minX < maxX);
  candidatesInX.sort((a, b) => a.minY - b.minY);

  let topNeighbor: Bounds | null = null;
  let bottomNeighbor: Bounds | null = null;

  for (const c of candidatesInX) {
    if (c.maxY < minY) topNeighbor = c;
    if (c.minY > maxY && !bottomNeighbor) {
      bottomNeighbor = c;
      break;
    }
  }

  if (topNeighbor && bottomNeighbor) {
    const totalSpace = bottomNeighbor.minY - topNeighbor.maxY;
    const targetGap = (totalSpace - draggedHeight) / 2;
    const targetY = topNeighbor.maxY + targetGap;
    const snapDiff = targetY - minY;

    if (Math.abs(snapDiff) < snapThreshold * 2) {
      const finalGap = Math.round(targetGap);
      const centerX = (minX + maxX) / 2;

      const guides: SmartGuide[] = [
        // Top gap
        {
          type: "spacing",
          x1: centerX,
          y1: topNeighbor.maxY,
          x2: centerX,
          y2: targetY,
          label: `${finalGap}`,
        },
        // Bottom gap
        {
          type: "spacing",
          x1: centerX,
          y1: targetY + draggedHeight,
          x2: centerX,
          y2: bottomNeighbor.minY,
          label: `${finalGap}`,
        },
      ];

      bestY = { adjustment: snapDiff, distance: Math.abs(snapDiff), guides };
    }
  }

  return { snapX: bestX, snapY: bestY };
}

// ============================================
// GRID SNAPPING
// ============================================

function findGridSnap(projected: Bounds, gridSize: number, snapThreshold: number): { snapX: number; snapY: number } {
  const { minX, minY } = projected;

  let snapX = 0;
  let snapY = 0;

  const snapLeft = Math.round(minX / gridSize) * gridSize;
  const snapTop = Math.round(minY / gridSize) * gridSize;

  if (Math.abs(snapLeft - minX) < snapThreshold) {
    snapX = snapLeft - minX;
  }
  if (Math.abs(snapTop - minY) < snapThreshold) {
    snapY = snapTop - minY;
  }

  return { snapX, snapY };
}

// ============================================
// GEOMETRY/POINT SNAPPING
// ============================================

function findGeometrySnaps(
  projected: Bounds,
  candidatePoints: Point[],
  snapThreshold: number,
): { snapX: number; snapY: number; guides: SmartGuide[] } {
  const { minX, maxX, centerX, minY, maxY, centerY } = projected;

  const myPoints = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
    { x: centerX, y: centerY },
  ];

  let bestDist = snapThreshold;
  let snapX = 0;
  let snapY = 0;
  let snapPoint: Point | null = null;

  for (const myP of myPoints) {
    for (const otherP of candidatePoints) {
      const dx = otherP.x - myP.x;
      const dy = otherP.y - myP.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bestDist) {
        bestDist = dist;
        snapX = dx;
        snapY = dy;
        snapPoint = otherP;
      }
    }
  }

  const guides: SmartGuide[] = [];
  if (snapPoint && bestDist < snapThreshold) {
    guides.push({
      type: "center",
      cx: snapPoint.x,
      cy: snapPoint.y,
    });
  }

  return { snapX, snapY, guides };
}

// ============================================
// MAIN SNAP CALCULATION
// ============================================

export function calculateSnapAdjustment(
  projectedBounds: Bounds,
  candidates: Bounds[],
  candidatePoints: Point[],
  snapToGrid: boolean,
  snapToObjects: boolean,
  snapToGeometry: boolean,
  scale: number,
  threshold = FIGMA_SNAP_THRESHOLD,
  gridSize = 10,
): SnapAdjustment {
  const snapThreshold = threshold / scale;
  const guides: SmartGuide[] = [];

  let snapX = 0;
  let snapY = 0;

  // 1. Grid Snapping (lowest priority)
  if (snapToGrid) {
    const gridResult = findGridSnap(projectedBounds, gridSize, snapThreshold);
    snapX = gridResult.snapX;
    snapY = gridResult.snapY;
  }

  // 2. Object Snapping (higher priority)
  if (snapToObjects && candidates.length > 0) {
    const alignResult = findAlignmentSnaps(projectedBounds, candidates, snapThreshold);
    const spacingResult = findSpacingSnaps(projectedBounds, candidates, snapThreshold);

    // For X: prefer alignment if it's closer, otherwise use spacing
    if (alignResult.snapX.distance <= spacingResult.snapX.distance) {
      if (alignResult.snapX.distance < snapThreshold) {
        snapX = alignResult.snapX.adjustment;
        guides.push(...alignResult.snapX.guides);
      }
    } else {
      snapX = spacingResult.snapX.adjustment;
      guides.push(...spacingResult.snapX.guides);
    }

    // For Y: prefer alignment if it's closer, otherwise use spacing
    if (alignResult.snapY.distance <= spacingResult.snapY.distance) {
      if (alignResult.snapY.distance < snapThreshold) {
        snapY = alignResult.snapY.adjustment;
        guides.push(...alignResult.snapY.guides);
      }
    } else {
      snapY = spacingResult.snapY.adjustment;
      guides.push(...spacingResult.snapY.guides);
    }
  }

  // 3. Geometry/Point Snapping (highest priority)
  if (snapToGeometry && candidatePoints.length > 0) {
    const geoResult = findGeometrySnaps(projectedBounds, candidatePoints, snapThreshold);

    if (geoResult.snapX !== 0 || geoResult.snapY !== 0) {
      snapX = geoResult.snapX;
      snapY = geoResult.snapY;
      guides.push(...geoResult.guides);
    }
  }

  return { x: snapX, y: snapY, guides };
}
