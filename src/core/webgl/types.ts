export interface RenderContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  vertexPool: Float32Array;
}
