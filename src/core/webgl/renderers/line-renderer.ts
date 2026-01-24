import type { LineElement } from "@/types";
import { drawDisc, drawLineBetweenPoints, resetRotation } from "../primitives";
import type { RenderContext } from "../types";
import { cssColorToRGBA } from "../utils";

function drawDashedLine(
  ctx: RenderContext,
  start: { x: number; y: number },
  end: { x: number; y: number },
  width: number,
  dashArray: number[],
): void {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const dirX = dx / len;
  const dirY = dy / len;
  let currentDist = 0;
  let index = 0;

  while (currentDist < len) {
    const dashLen = dashArray[index % dashArray.length];
    if (index % 2 === 0) {
      const drawLen = Math.min(dashLen, len - currentDist);
      const p1 = {
        x: start.x + dirX * currentDist,
        y: start.y + dirY * currentDist,
      };
      const p2 = {
        x: start.x + dirX * (currentDist + drawLen),
        y: start.y + dirY * (currentDist + drawLen),
      };
      drawLineBetweenPoints(ctx, p1, p2, width, 1);
    }
    currentDist += dashLen;
    index++;
  }
}

function drawMarker(
  ctx: RenderContext,
  x: number,
  y: number,
  angle: number,
  lineWidth: number,
  _scale: number,
  type: "arrow" | "triangle" | "reversed_triangle" | "circle" | "diamond" | "round" | "square",
): void {
  const { gl, positionBuffer } = ctx;
  const size = Math.max(lineWidth * 3, 10);
  const halfSize = size / 2;

  let vertices: Float32Array;

  const transform = (p: { x: number; y: number }) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x + p.x * cos - p.y * sin,
      y: y + p.x * sin + p.y * cos,
    };
  };

  if (type === "arrow") {
    const pTip = { x: 0, y: 0 };
    const pTop = { x: -size, y: -halfSize };
    const pBot = { x: -size, y: halfSize };

    const vTip = transform(pTip);
    const vTop = transform(pTop);
    const vBot = transform(pBot);

    drawLineBetweenPoints(ctx, vTop, vTip, lineWidth, 1);
    drawLineBetweenPoints(ctx, vBot, vTip, lineWidth, 1);

    const radius = lineWidth / 2;
    drawDisc(ctx, vTip.x, vTip.y, radius);
    drawDisc(ctx, vTop.x, vTop.y, radius);
    drawDisc(ctx, vBot.x, vBot.y, radius);

    return;
  } else if (type === "triangle") {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: -size, y: -halfSize };
    const p3 = { x: -size, y: halfSize };
    const v1 = transform(p1);
    const v2 = transform(p2);
    const v3 = transform(p3);
    vertices = new Float32Array([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y]);
  } else if (type === "reversed_triangle") {
    const p1 = { x: -size, y: 0 };
    const p2 = { x: 0, y: -halfSize };
    const p3 = { x: 0, y: halfSize };
    const v1 = transform(p1);
    const v2 = transform(p2);
    const v3 = transform(p3);
    vertices = new Float32Array([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y]);
  } else if (type === "circle" || type === "round") {
    const segments = 16;
    const radius = halfSize;
    const center = { x: -radius, y: 0 };
    const circleVerts = [];
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const cp1 = { x: center.x + Math.cos(a1) * radius, y: center.y + Math.sin(a1) * radius };
      const cp2 = { x: center.x + Math.cos(a2) * radius, y: center.y + Math.sin(a2) * radius };
      const cv1 = transform(center);
      const cv2 = transform(cp1);
      const cv3 = transform(cp2);
      circleVerts.push(cv1.x, cv1.y, cv2.x, cv2.y, cv3.x, cv3.y);
    }
    vertices = new Float32Array(circleVerts);
  } else if (type === "diamond") {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: -halfSize, y: -halfSize };
    const p3 = { x: -size, y: 0 };
    const p4 = { x: -halfSize, y: halfSize };
    const v1 = transform(p1);
    const v2 = transform(p2);
    const v3 = transform(p3);
    const v4 = transform(p4);

    vertices = new Float32Array([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, v1.x, v1.y, v3.x, v3.y, v4.x, v4.y]);
  } else if (type === "square") {
    const p1 = { x: 0, y: -halfSize };
    const p2 = { x: -size, y: -halfSize };
    const p3 = { x: -size, y: halfSize };
    const p4 = { x: 0, y: halfSize };

    const v1 = transform(p1);
    const v2 = transform(p2);
    const v3 = transform(p3);
    const v4 = transform(p4);

    vertices = new Float32Array([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, v1.x, v1.y, v3.x, v3.y, v4.x, v4.y]);
  } else {
    vertices = new Float32Array([]);
  }

  if (vertices.length > 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    resetRotation(ctx);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }
}

export function drawLine(ctx: RenderContext, element: LineElement, scale: number): void {
  const { x1, y1, x2, y2, stroke, opacity, markerStart, markerEnd } = element;
  if (!stroke) return;

  const { gl, program } = ctx;
  const color = cssColorToRGBA(stroke.color);
  color[3] *= (stroke.opacity ?? 1) * opacity;

  resetRotation(ctx);
  gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...color);
  gl.uniform2f(gl.getUniformLocation(program, "u_offset"), 0, 0);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  const markerSize = Math.max(stroke.width * 3, 10);

  let startOffset = 0;
  let endOffset = 0;

  if (markerStart && markerStart !== "none") {
    startOffset = markerStart === "arrow" ? 0 : markerSize;
  }
  if (markerEnd && markerEnd !== "none") {
    endOffset = markerEnd === "arrow" ? 0 : markerSize;
  }

  if (length > startOffset + endOffset) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const adjustedStart = {
      x: x1 + cos * startOffset,
      y: y1 + sin * startOffset,
    };
    const adjustedEnd = {
      x: x2 - cos * endOffset,
      y: y2 - sin * endOffset,
    };

    if (stroke.dashArray && stroke.dashArray.length > 0) {
      drawDashedLine(ctx, adjustedStart, adjustedEnd, stroke.width, stroke.dashArray);
    } else {
      drawLineBetweenPoints(ctx, adjustedStart, adjustedEnd, stroke.width, 1);
    }
  }

  if (markerStart && markerStart !== "none") {
    drawMarker(ctx, x1, y1, angle + Math.PI, stroke.width, scale, markerStart);
  }
  if (markerEnd && markerEnd !== "none") {
    drawMarker(ctx, x2, y2, angle, stroke.width, scale, markerEnd);
  }
}
