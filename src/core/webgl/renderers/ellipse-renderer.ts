import { cssToRGBA } from "@/lib/colors";
import { sortStopsByOffset } from "@/lib/gradient-utils";
import type { EllipseElement, Fill, LinearGradient, RadialGradient } from "@/types";
import { drawLineBetweenPoints, resetRotation } from "../primitives";
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

function drawEllipseWithGradient(ctx: RenderContext, element: EllipseElement, gradient: LinearGradient | RadialGradient): void {
  const { gl, gradientProgram, positionBuffer, uvBuffer, resolution, translation, scale } = ctx;
  const { cx, cy, rx, ry, rotation, opacity } = element;

  const segments = Math.max(32, Math.ceil(Math.max(rx, ry) / 2));

  // biome-ignore lint/correctness/useHookAtTopLevel: not a React hook
  gl.useProgram(gradientProgram);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_resolution"), resolution[0], resolution[1]);
  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_translation"), translation[0], translation[1]);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_scale"), scale);

  const positionVertices: number[] = [];
  const uvVertices: number[] = [];

  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;

    const x1 = cx + Math.cos(angle1) * rx;
    const y1 = cy + Math.sin(angle1) * ry;
    const x2 = cx + Math.cos(angle2) * rx;
    const y2 = cy + Math.sin(angle2) * ry;

    positionVertices.push(cx, cy, x1, y1, x2, y2);

    const u1 = (Math.cos(angle1) + 1) / 2;
    const v1 = (Math.sin(angle1) + 1) / 2;
    const u2 = (Math.cos(angle2) + 1) / 2;
    const v2 = (Math.sin(angle2) + 1) / 2;

    uvVertices.push(0.5, 0.5, u1, v1, u2, v2);
  }

  const posLoc = gl.getAttribLocation(gradientProgram, "a_position");
  const uvLoc = gl.getAttribLocation(gradientProgram, "a_uv");

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionVertices), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvVertices), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_offset"), 0, 0);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_rotation"), rotation);
  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_rotationCenter"), cx, cy);

  gl.uniform2f(gl.getUniformLocation(gradientProgram, "u_rectSize"), rx * 2, ry * 2);
  gl.uniform1f(gl.getUniformLocation(gradientProgram, "u_cornerRadius"), 0);

  setupGradientUniforms(gl, gradientProgram, gradient, (element.fillOpacity ?? 1) * opacity);

  gl.drawArrays(gl.TRIANGLES, 0, segments * 3);

  gl.disableVertexAttribArray(uvLoc);
}

export function drawEllipse(ctx: RenderContext, element: EllipseElement, _scale: number): void {
  const { cx, cy, rx, ry, fill, stroke, rotation, opacity } = element;
  const { gl, positionBuffer, program, gradients } = ctx;
  const segments = Math.max(32, Math.ceil(Math.max(rx, ry) / 2));

  if (fill) {
    if (isGradientFill(fill)) {
      const gradient = gradients.get(fill.ref);
      if (gradient) {
        drawEllipseWithGradient(ctx, element, gradient);
        // biome-ignore lint/correctness/useHookAtTopLevel: not a React hook
        gl.useProgram(program);
        const posLoc = gl.getAttribLocation(program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      }
    } else {
      const color = cssColorToRGBA(fill);
      color[3] *= (element.fillOpacity ?? 1) * opacity;

      const vertices: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry);
      }

      vertices.push(cx + rx, cy);

      const triangleVertices: number[] = [];
      for (let i = 0; i < segments; i++) {
        triangleVertices.push(cx, cy);
        triangleVertices.push(vertices[i * 2], vertices[i * 2 + 1]);
        triangleVertices.push(vertices[(i + 1) * 2], vertices[(i + 1) * 2 + 1]);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

      gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...color);
      gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), rotation);
      gl.uniform2f(gl.getUniformLocation(program, "u_offset"), 0, 0);
      gl.uniform2f(gl.getUniformLocation(program, "u_rotationCenter"), cx, cy);
      gl.drawArrays(gl.TRIANGLES, 0, segments * 3);
    }
  }

  if (stroke) {
    const strokeColor = cssColorToRGBA(stroke.color);
    strokeColor[3] *= (stroke.opacity ?? 1) * opacity;

    resetRotation(ctx);
    gl.uniform4f(gl.getUniformLocation(program, "u_color"), ...strokeColor);
    gl.uniform2f(gl.getUniformLocation(program, "u_offset"), 0, 0);

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const lx1 = Math.cos(angle1) * rx;
      const ly1 = Math.sin(angle1) * ry;
      const lx2 = Math.cos(angle2) * rx;
      const ly2 = Math.sin(angle2) * ry;

      const p1 = {
        x: cx + lx1 * cos - ly1 * sin,
        y: cy + lx1 * sin + ly1 * cos,
      };
      const p2 = {
        x: cx + lx2 * cos - ly2 * sin,
        y: cy + lx2 * sin + ly2 * cos,
      };

      drawLineBetweenPoints(ctx, p1, p2, stroke.width, 1);
    }
  }
}
