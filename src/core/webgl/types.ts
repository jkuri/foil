import type { LinearGradient, RadialGradient } from "@/types";

export interface RenderContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  gradientProgram: WebGLProgram;
  positionBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer;
  vertexPool: Float32Array;
  gradients: Map<string, LinearGradient | RadialGradient>;
  resolution: [number, number];
  translation: [number, number];
  scale: number;
}
