export const VERTEX_SHADER = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_offset;
  uniform float u_scale;
  uniform float u_rotation;
  uniform vec2 u_rotationCenter;

  void main() {

    vec2 pos = a_position + u_offset - u_rotationCenter;
    float cosR = cos(u_rotation);
    float sinR = sin(u_rotation);
    vec2 rotated = vec2(
      pos.x * cosR - pos.y * sinR,
      pos.x * sinR + pos.y * cosR
    );
    pos = rotated + u_rotationCenter;

    vec2 position = ((pos * u_scale) + u_translation) / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(position * vec2(1, -1), 0, 1);
  }
`;

export const FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

export const GRID_VERTEX_SHADER = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }
`;

export const GRADIENT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_offset;
  uniform float u_scale;
  uniform float u_rotation;
  uniform vec2 u_rotationCenter;
  varying vec2 v_uv;

  void main() {
    vec2 pos = a_position + u_offset - u_rotationCenter;
    float cosR = cos(u_rotation);
    float sinR = sin(u_rotation);
    vec2 rotated = vec2(
      pos.x * cosR - pos.y * sinR,
      pos.x * sinR + pos.y * cosR
    );
    pos = rotated + u_rotationCenter;

    vec2 position = ((pos * u_scale) + u_translation) / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(position * vec2(1, -1), 0, 1);
    v_uv = a_uv;
  }
`;

export const GRADIENT_FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 v_uv;

  uniform int u_gradientType; 
  uniform vec4 u_gradientCoords; 
  uniform float u_opacity;
  uniform vec2 u_rectSize; 
  uniform float u_cornerRadius; 

  
  uniform vec4 u_stopColor0;
  uniform vec4 u_stopColor1;
  uniform vec4 u_stopColor2;
  uniform vec4 u_stopColor3;
  uniform vec4 u_stopColor4;
  uniform vec4 u_stopColor5;
  uniform vec4 u_stopColor6;
  uniform vec4 u_stopColor7;
  uniform float u_stopOffset0;
  uniform float u_stopOffset1;
  uniform float u_stopOffset2;
  uniform float u_stopOffset3;
  uniform float u_stopOffset4;
  uniform float u_stopOffset5;
  uniform float u_stopOffset6;
  uniform float u_stopOffset7;
  uniform int u_stopCount;

  vec4 getStopColor(int i) {
    if (i == 0) return u_stopColor0;
    if (i == 1) return u_stopColor1;
    if (i == 2) return u_stopColor2;
    if (i == 3) return u_stopColor3;
    if (i == 4) return u_stopColor4;
    if (i == 5) return u_stopColor5;
    if (i == 6) return u_stopColor6;
    return u_stopColor7;
  }

  float getStopOffset(int i) {
    if (i == 0) return u_stopOffset0;
    if (i == 1) return u_stopOffset1;
    if (i == 2) return u_stopOffset2;
    if (i == 3) return u_stopOffset3;
    if (i == 4) return u_stopOffset4;
    if (i == 5) return u_stopOffset5;
    if (i == 6) return u_stopOffset6;
    return u_stopOffset7;
  }

  vec4 getGradientColor(float t) {
    t = clamp(t, 0.0, 1.0);

    if (u_stopCount <= 0) return vec4(0.0);
    if (u_stopCount == 1) return u_stopColor0;

    
    vec4 result = u_stopColor0;

    if (t <= u_stopOffset0) {
      return u_stopColor0;
    }

    for (int i = 0; i < 7; i++) {
      if (i + 1 >= u_stopCount) break;

      float offset1 = getStopOffset(i);
      float offset2 = getStopOffset(i + 1);
      vec4 color1 = getStopColor(i);
      vec4 color2 = getStopColor(i + 1);

      if (t >= offset1 && t <= offset2) {
        float range = offset2 - offset1;
        float localT = range > 0.0 ? (t - offset1) / range : 0.0;
        return mix(color1, color2, localT);
      }

      if (t > offset2) {
        result = color2;
      }
    }

    return result;
  }

  
  float roundedRectSDF(vec2 p, vec2 size, float r) {
    vec2 d = abs(p) - size + r;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main() {
    
    if (u_cornerRadius > 0.0) {
      vec2 pixelPos = v_uv * u_rectSize;
      vec2 center = u_rectSize * 0.5;
      float r = min(u_cornerRadius, min(u_rectSize.x, u_rectSize.y) * 0.5);
      float d = roundedRectSDF(pixelPos - center, center, r);
      if (d > 0.0) {
        discard;
      }
    }

    float t;

    if (u_gradientType == 0) {
      
      vec2 start = u_gradientCoords.xy;
      vec2 end = u_gradientCoords.zw;
      vec2 dir = end - start;
      float len = length(dir);
      if (len > 0.0) {
        vec2 normalized = dir / len;
        t = dot(v_uv - start, normalized) / len;
      } else {
        t = 0.0;
      }
    } else {
      
      vec2 center = u_gradientCoords.xy;
      float radius = u_gradientCoords.z;
      float dist = length(v_uv - center);
      t = radius > 0.0 ? dist / radius : 0.0;
    }

    vec4 color = getGradientColor(t);
    color.a *= u_opacity;

    gl_FragColor = color;
  }
`;

export const GRID_FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform float u_scale;
  uniform vec3 u_bgColor;
  uniform float u_bgVisible;

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    fragCoord.y = u_resolution.y - fragCoord.y;
    vec2 worldPos = (fragCoord - u_translation) / u_scale;

    vec3 bgColor;

    if (u_bgVisible > 0.5) {
        bgColor = u_bgColor;
    } else {

        float size = 10.0;
        vec2 p = floor(worldPos / size);
        float pattern = mod(p.x + p.y, 2.0);
        bgColor = mix(vec3(1.0), vec3(0.95), pattern);
    }

    float baseSpacing = 10.0;
    float spacing = baseSpacing;

    vec2 gridPos = mod(worldPos, spacing);
    vec2 dist = min(gridPos, spacing - gridPos);

    float lineThickness = 1.0 / u_scale;
    float lineY = smoothstep(lineThickness, 0.0, dist.y);
    float lineX = smoothstep(lineThickness, 0.0, dist.x);
    float grid = max(lineX, lineY);

    vec3 gridColor = vec3(0.92);

    if (u_bgVisible > 0.5) {
        gl_FragColor = vec4(mix(bgColor, gridColor, grid), 1.0);
    } else {
        gl_FragColor = vec4(bgColor, 1.0);
    }
  }
`;
