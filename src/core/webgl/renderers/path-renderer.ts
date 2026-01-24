import { cssToRGBA } from "@/lib/colors";
import { sortStopsByOffset } from "@/lib/gradient-utils";
import { parsePath, pathToFillVertices, pathToStrokeVertices } from "@/lib/path-parser";
import type { Fill, LinearGradient, PathElement, RadialGradient } from "@/types";
import type { RenderContext } from "../types";
import { cssColorToRGBA } from "../utils";

function isGradientFill(fill: Fill): fill is { ref: string; type: "gradient" } {
  return fill !== null && typeof fill === "object" && fill.type === "gradient";
}

function setupGradientUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  gradient: LinearGradient | RadialGradient,
  opacity: number,
): void {
  const isLinear = gradient.type === "linearGradient";

  gl.uniform1i(gl.getUniformLocation(program, "u_gradientType"), isLinear ? 0 : 1);

  if (isLinear) {
    gl.uniform4f(gl.getUniformLocation(program, "u_gradientCoords"), gradient.x1, gradient.y1, gradient.x2, gradient.y2);
  } else {
    gl.uniform4f(gl.getUniformLocation(program, "u_gradientCoords"), gradient.cx, gradient.cy, gradient.r, 0);
  }

  gl.uniform1f(gl.getUniformLocation(program, "u_opacity"), opacity);

  const sortedStops = sortStopsByOffset(gradient.stops);
  const stopCount = Math.min(sortedStops.length, 8);

  gl.uniform1i(gl.getUniformLocation(program, "u_stopCount"), stopCount);

  const colors: number[] = [];
  const offsets: number[] = [];

  for (let i = 0; i < 8; i++) {
    if (i < stopCount) {
      const stop = sortedStops[i];
      const rgba = cssToRGBA(stop.color);
      colors.push(rgba[0], rgba[1], rgba[2], stop.opacity ?? 1);
      offsets.push(stop.offset);
    } else {
      colors.push(0, 0, 0, 0);
      offsets.push(0);
    }
  }

  for (let i = 0; i < 8; i++) {
    gl.uniform4f(gl.getUniformLocation(program, `u_stopColor${i}`), colors[i * 4], colors[i * 4 + 1], colors[i * 4 + 2], colors[i * 4 + 3]);
    gl.uniform1f(gl.getUniformLocation(program, `u_stopOffset${i}`), offsets[i]);
  }
}

interface PathCacheEntry {
  d: string;
  vertices: Float32Array;
  strokeVertices: Float32Array;
  nativeBounds: { x: number; y: number };
}

const pathCache = new Map<string, PathCacheEntry>();

function drawPathWithGradient(
  ctx: RenderContext,
  element: PathElement,
  vertices: Float32Array,
  gradient: LinearGradient | RadialGradient,
  dx: number,
  dy: number,
): void {
  const { gl, gradientProgram, positionBuffer, uvBuffer, resolution, translation, scale } = ctx;
  const { bounds, rotation, opacity } = element;
  const { x, y, width, height } = bounds;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // biome-ignore lint/correctness/useHookAtTopLevel: not a React hook
  gl.useProgram(gradientProgram);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_resolution"), resolution[0], resolution[1]);
  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_translation"), translation[0], translation[1]);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_scale"), scale);

  const uvVertices = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 2) {
    const vx = vertices[i] + dx;
    const vy = vertices[i + 1] + dy;

    uvVertices[i] = width > 0 ? (vx - x) / width : 0;
    uvVertices[i + 1] = height > 0 ? (vy - y) / height : 0;
  }

  const posLoc = gl.getAttribLocation(gradientProgram, "a_position");
  const uvLoc = gl.getAttribLocation(gradientProgram, "a_uv");

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvVertices, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_offset"), dx, dy);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_rotation"), rotation);
  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_rotationCenter"), centerX, centerY);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_rectSize"), width, height);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_cornerRadius"), 0);

  setupGradientUniforms(gl, gradientProgram, gradient, (element.fillOpacity ?? 1) * opacity);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

  gl.disableVertexAttribArray(uvLoc);
}

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
    if (isGradientFill(fill)) {
      const gradient = ctx.gradients.get(fill.ref);
      if (gradient) {
        drawPathWithGradient(ctx, element, cached.vertices, gradient, dx, dy);

        // biome-ignore lint/correctness/useHookAtTopLevel: not a React hook
        gl.useProgram(program);
        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(program, "u_offset"), dx, dy);
      }
    } else {
      const color = cssColorToRGBA(fill);
      color[3] *= (element.fillOpacity ?? 1) * opacity;

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cached.vertices, gl.STATIC_DRAW);
      gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...color);
      gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), rotation);
      gl.uniform2f(gl.getUniformLocation(program, "u_rotationCenter"), centerX, centerY);
      gl.drawArrays(gl.TRIANGLES, 0, cached.vertices.length / 2);
    }
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
