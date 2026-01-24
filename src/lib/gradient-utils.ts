import type { GradientStop, LinearGradient, RadialGradient } from "@/types";

export function generateGradientId(): string {
  return `gradient-${crypto.randomUUID()}`;
}

export function createDefaultLinearGradient(angle = 0): LinearGradient {
  const coords = angleToGradientCoords(angle);
  return {
    type: "linearGradient",
    id: generateGradientId(),
    ...coords,
    stops: [
      { offset: 0, color: "#000000", opacity: 1 },
      { offset: 1, color: "#ffffff", opacity: 1 },
    ],
    gradientUnits: "objectBoundingBox",
  };
}

export function createDefaultRadialGradient(): RadialGradient {
  return {
    type: "radialGradient",
    id: generateGradientId(),
    cx: 0.5,
    cy: 0.5,
    r: 0.5,
    stops: [
      { offset: 0, color: "#ffffff", opacity: 1 },
      { offset: 1, color: "#000000", opacity: 1 },
    ],
    gradientUnits: "objectBoundingBox",
  };
}

export function angleToGradientCoords(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const x1 = 0.5 - 0.5 * Math.cos(angleRad);
  const y1 = 0.5 - 0.5 * Math.sin(angleRad);
  const x2 = 0.5 + 0.5 * Math.cos(angleRad);
  const y2 = 0.5 + 0.5 * Math.sin(angleRad);
  return { x1, y1, x2, y2 };
}

export function gradientCoordsToAngle(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return Math.round(angle) % 360;
}

export function sortStopsByOffset(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.offset - b.offset);
}

export function addStopAtPosition(stops: GradientStop[], offset: number): GradientStop[] {
  const sortedStops = sortStopsByOffset(stops);
  const color = interpolateColorAtOffset(sortedStops, offset);
  const newStop: GradientStop = { offset, color, opacity: 1 };
  return sortStopsByOffset([...sortedStops, newStop]);
}

export function removeStop(stops: GradientStop[], index: number): GradientStop[] {
  if (stops.length <= 2) return stops;
  return stops.filter((_, i) => i !== index);
}

export function updateStop(stops: GradientStop[], index: number, updates: Partial<GradientStop>): GradientStop[] {
  return stops.map((stop, i) => (i === index ? { ...stop, ...updates } : stop));
}

function interpolateColorAtOffset(stops: GradientStop[], offset: number): string {
  if (stops.length === 0) return "#000000";
  if (stops.length === 1) return stops[0].color;

  const sorted = sortStopsByOffset(stops);

  if (offset <= sorted[0].offset) return sorted[0].color;
  if (offset >= sorted[sorted.length - 1].offset) return sorted[sorted.length - 1].color;

  let startStop = sorted[0];
  let endStop = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (offset >= sorted[i].offset && offset <= sorted[i + 1].offset) {
      startStop = sorted[i];
      endStop = sorted[i + 1];
      break;
    }
  }

  const range = endStop.offset - startStop.offset;
  const t = range === 0 ? 0 : (offset - startStop.offset) / range;

  return interpolateHexColors(startStop.color, endStop.color, t);
}

function interpolateHexColors(color1: string, color2: string, t: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function gradientToCSS(gradient: LinearGradient | RadialGradient): string {
  const sortedStops = sortStopsByOffset(gradient.stops);
  const stopsCSS = sortedStops
    .map((stop) => {
      const color = stop.opacity !== undefined && stop.opacity < 1 ? hexToRgba(stop.color, stop.opacity) : stop.color;
      return `${color} ${stop.offset * 100}%`;
    })
    .join(", ");

  if (gradient.type === "linearGradient") {
    const angle = gradientCoordsToAngle(gradient.x1, gradient.y1, gradient.x2, gradient.y2);
    return `linear-gradient(${angle}deg, ${stopsCSS})`;
  } else {
    const cx = gradient.cx * 100;
    const cy = gradient.cy * 100;
    return `radial-gradient(circle at ${cx}% ${cy}%, ${stopsCSS})`;
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isLinearGradient(gradient: LinearGradient | RadialGradient): gradient is LinearGradient {
  return gradient.type === "linearGradient";
}

export function isRadialGradient(gradient: LinearGradient | RadialGradient): gradient is RadialGradient {
  return gradient.type === "radialGradient";
}
