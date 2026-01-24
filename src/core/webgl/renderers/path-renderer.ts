import { parsePath, pathToFillVertices, pathToStrokeVertices } from "@/lib/path-parser";
import type { PathElement } from "@/types";
import type { RenderContext } from "../types";
import { cssColorToRGBA } from "../utils";

interface PathCacheEntry {
  d: string;
  vertices: Float32Array;
  strokeVertices: Float32Array;
  nativeBounds: { x: number; y: number };
}

const pathCache = new Map<string, PathCacheEntry>();

export function drawPath(ctx: RenderContext, element: PathElement): void {
  const { id, d, bounds, fill, stroke, opacity, rotation } = element;
  if (!fill && !stroke) return;

  const { gl, program, positionBuffer } = ctx;
  const { x, y, width, height } = bounds;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  let cached = pathCache.get(id);

  if (cached && cached.d !== d) {
    cached = undefined;
  }

  if (!cached) {
    const commands = parsePath(d);
    if (commands.length === 0) return;

    let fillVertices: Float32Array;
    let strokeVertices: Float32Array;

    try {
      fillVertices = fill ? new Float32Array(pathToFillVertices(commands)) : new Float32Array(0);
      strokeVertices = stroke ? new Float32Array(pathToStrokeVertices(commands, stroke.width)) : new Float32Array(0);
    } catch (e) {
      console.warn("Failed to parse path:", id, e);
      fillVertices = new Float32Array(0);
      strokeVertices = new Float32Array(0);
    }

    let minX = Infinity;
    let minY = Infinity;

    const samples = fillVertices.length > 0 ? fillVertices : strokeVertices;
    if (samples.length > 0) {
      for (let i = 0; i < samples.length; i += 2) {
        if (samples[i] < minX) minX = samples[i];
        if (samples[i + 1] < minY) minY = samples[i + 1];
      }
    } else {
      minX = element.bounds.x;
      minY = element.bounds.y;
    }

    cached = {
      d,
      vertices: fillVertices,
      strokeVertices: strokeVertices,
      nativeBounds: { x: minX, y: minY },
    };
    pathCache.set(id, cached);
  }

  const dx = element.bounds.x - cached.nativeBounds.x;
  const dy = element.bounds.y - cached.nativeBounds.y;
  gl.uniform2f(gl.getUniformLocation(program, "u_offset"), dx, dy);

  if (fill && cached.vertices.length >= 6) {
    const color = cssColorToRGBA(fill);
    color[3] *= (element.fillOpacity ?? 1) * opacity;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cached.vertices, gl.STATIC_DRAW);
    gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...color);
    gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), rotation);
    gl.uniform2f(gl.getUniformLocation(program, "u_rotationCenter"), centerX, centerY);
    gl.drawArrays(gl.TRIANGLES, 0, cached.vertices.length / 2);
  }

  if (stroke && cached.strokeVertices.length >= 6) {
    const strokeColor = typeof stroke.color === "string" ? stroke.color : "#000000";
    const color = cssColorToRGBA(strokeColor);
    color[3] *= (stroke.opacity ?? 1) * opacity;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cached.strokeVertices, gl.STATIC_DRAW);
    gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...color);
    gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), rotation);
    gl.uniform2f(gl.getUniformLocation(program, "u_rotationCenter"), centerX, centerY);
    gl.drawArrays(gl.TRIANGLES, 0, cached.strokeVertices.length / 2);
  }
}
