import { type GroupElement, getFillColor, type PathElement, type TextElement } from "@/types";
import { forEachGlyphCompound, getFont } from "./text-renderer";

// Return type for text conversion
export interface TextConversionResult {
  group: GroupElement;
  paths: PathElement[];
}

/**
 * Convert text to actual glyph outlines using opentype.js
 * Uses the same font loading as text-renderer.ts to ensure consistency
 */
export async function convertTextToPath(textElement: TextElement): Promise<TextConversionResult> {
  const { text, fontFamily, fontWeight = "400", fill, stroke, opacity, rotation, name } = textElement;
  // Ensure numeric values are actually numbers (could be strings from some UI components)
  const fontSize = Number(textElement.fontSize);
  const x = Number(textElement.x);
  const y = Number(textElement.y);

  // Load the font(s) using shared utility
  const fonts = await getFont(fontFamily, fontWeight);

  if (!fonts || fonts.length === 0) {
    throw new Error(`Failed to load font: ${fontFamily}`);
  }

  // Collect glyph information with proper kerning using composite logic
  const glyphInfos: { glyph: opentype.Glyph; x: number; font: opentype.Font }[] = [];

  forEachGlyphCompound(fonts, text, x, y, fontSize, (glyph, glyphX, _glyphY, font) => {
    glyphInfos.push({ glyph, x: glyphX, font });
  });

  // Create a separate path element for each glyph
  const pathElements: PathElement[] = [];

  for (const { glyph, x: glyphX } of glyphInfos) {
    // Get the path for this glyph at its computed position (with kerning applied)
    const glyphPath = glyph.getPath(glyphX, y, fontSize);

    // Convert to path data with maximum precision
    const pathData = glyphPath.toPathData(15);

    // Skip empty glyphs (like spaces)
    if (!pathData || pathData === "") continue;

    // Get accurate bounding box
    const bbox = glyphPath.getBoundingBox();

    // Skip glyphs with no bounds (spaces, etc.)
    if (bbox.x1 === Infinity || bbox.x2 === -Infinity) continue;

    // Get the character name from the glyph
    const charName = glyph.name || glyph.unicode ? String.fromCodePoint(glyph.unicode!) : "Glyph";

    // Create path element
    const pathElement: PathElement = {
      id: crypto.randomUUID(),
      type: "path",
      name: charName,
      d: pathData,
      bounds: {
        x: bbox.x1,
        y: bbox.y1,
        width: bbox.x2 - bbox.x1,
        height: bbox.y2 - bbox.y1,
      },
      rotation: 0,
      fill: getFillColor(fill, "#000000"),
      stroke,
      opacity: opacity ?? 1,
    };

    pathElements.push(pathElement);
  }

  // Create a group containing all the letter paths
  const groupElement: GroupElement = {
    id: crypto.randomUUID(),
    type: "group",
    name: `${name} (Outlined)`,
    childIds: pathElements.map((p) => p.id),
    rotation: rotation || 0,
    opacity: opacity ?? 1,
    visible: true,
    locked: false,
  };

  return {
    group: groupElement,
    paths: pathElements,
  };
}

/**
 * Calculate accurate text bounds using OpenType.js
 */
export async function calculateTextBounds(
  textElement: TextElement,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const { text, fontFamily, fontWeight = "400" } = textElement;
  const fontSize = Number(textElement.fontSize);
  const x = Number(textElement.x);
  const y = Number(textElement.y);

  const fonts = await getFont(fontFamily, fontWeight);

  if (!fonts || fonts.length === 0) {
    return { x, y, width: 0, height: 0 };
  }

  // Use shared logic if possible, or manual min/max
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  forEachGlyphCompound(fonts, text, x, y, fontSize, (glyph, gx, gy) => {
    const path = glyph.getPath(gx, gy, fontSize);
    const bbox = path.getBoundingBox();
    if (bbox.x1 < minX) minX = bbox.x1;
    if (bbox.y1 < minY) minY = bbox.y1;
    if (bbox.x2 > maxX) maxX = bbox.x2;
    if (bbox.y2 > maxY) maxY = bbox.y2;
  });

  if (minX === Infinity) return { x, y, width: 0, height: 0 };

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
