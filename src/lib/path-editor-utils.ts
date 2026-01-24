import { SVGPathData } from "svg-pathdata";

export interface EditablePoint {
  x: number;
  y: number;
  type: "corner" | "smooth" | "symmetric";
  start: boolean;

  handleIn?: { x: number; y: number };

  handleOut?: { x: number; y: number };
}

export function parsePathToEditable(d: string): EditablePoint[] {
  if (!d) return [];

  const pathData = new SVGPathData(d).toAbs().normalizeHVZ().normalizeST();

  const points: EditablePoint[] = [];
  const commands = pathData.commands;

  if (commands.length === 0) return [];

  let lastX = 0;
  let lastY = 0;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    switch (cmd.type) {
      case SVGPathData.MOVE_TO: {
        points.push({
          x: cmd.x,
          y: cmd.y,
          type: "corner",
          start: true,
        });
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      }

      case SVGPathData.LINE_TO: {
        points.push({
          x: cmd.x,
          y: cmd.y,
          type: "corner",
          start: false,
        });
        lastX = cmd.x;
        lastY = cmd.y;
        break;
      }

      case SVGPathData.CURVE_TO: {
        const prevPoint = points[points.length - 1];
        if (prevPoint) {
          prevPoint.handleOut = { x: cmd.x1, y: cmd.y1 };
        }

        points.push({
          x: cmd.x,
          y: cmd.y,
          type: "corner",
          start: false,
          handleIn: { x: cmd.x2, y: cmd.y2 },
        });

        lastX = cmd.x;
        lastY = cmd.y;
        break;
      }

      case SVGPathData.CLOSE_PATH: {
        break;
      }

      case SVGPathData.QUAD_TO: {
        const qx1 = cmd.x1;
        const qy1 = cmd.y1;
        const qx = cmd.x;
        const qy = cmd.y;

        const prevX = lastX;
        const prevY = lastY;

        const cx1 = prevX + (2 / 3) * (qx1 - prevX);
        const cy1 = prevY + (2 / 3) * (qy1 - prevY);
        const cx2 = qx + (2 / 3) * (qx1 - qx);
        const cy2 = qy + (2 / 3) * (qy1 - qy);

        const prevPoint = points[points.length - 1];
        if (prevPoint) {
          prevPoint.handleOut = { x: cx1, y: cy1 };
        }

        points.push({
          x: qx,
          y: qy,
          type: "corner",
          start: false,
          handleIn: { x: cx2, y: cy2 },
        });

        lastX = qx;
        lastY = qy;
        break;
      }
    }
  }

  return points;
}

export function stringifyEditablePath(points: EditablePoint[]): string {
  if (points.length === 0) return "";

  const cmds: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (p.start) {
      cmds.push(`M ${p.x} ${p.y}`);
      continue;
    }

    const prev = points[i - 1];

    if (prev?.handleOut || p.handleIn) {
      const cp1x = prev?.handleOut?.x ?? prev.x;
      const cp1y = prev?.handleOut?.y ?? prev.y;

      const cp2x = p.handleIn?.x ?? p.x;
      const cp2y = p.handleIn?.y ?? p.y;

      cmds.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p.x} ${p.y}`);
    } else {
      cmds.push(`L ${p.x} ${p.y}`);
    }
  }

  return cmds.join(" ");
}

import { parsePath, pathToFillVertices, pathToStrokeVertices } from "./path-parser";

export function getPointsBounds(points: EditablePoint[]): { x: number; y: number; width: number; height: number } {
  const d = stringifyEditablePath(points);
  const commands = parsePath(d);

  if (commands.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let vertices: number[] = [];
  try {
    vertices = pathToFillVertices(commands);
    if (vertices.length === 0) {
      vertices = pathToStrokeVertices(commands, 2);
    }
  } catch (e) {
    console.warn("Failed to calculate bounds via tessellation:", e);
  }

  if (vertices.length === 0) {
    return getPointsBoundsLegacy(points);
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < vertices.length; i += 2) {
    if (vertices[i] < minX) minX = vertices[i];
    if (vertices[i + 1] < minY) minY = vertices[i + 1];
  }

  for (let i = 0; i < vertices.length; i += 2) {
    if (vertices[i] > maxX) maxX = vertices[i];
    if (vertices[i + 1] > maxY) maxY = vertices[i + 1];
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getPointsBoundsLegacy(points: EditablePoint[]) {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
