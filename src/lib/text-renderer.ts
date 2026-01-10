import opentype from "opentype.js";

// Font cache to avoid reloading fonts
const fontCache = new Map<string, opentype.Font>();

// Map fonts to their file paths (must match text-to-path.ts)
// Now using string[] to support split fonts (latin / latin-ext)
const FONT_FILES: Record<string, Record<string, string[]>> = {
  Inter: {
    "100": ["/fonts/inter-latin-100-normal.woff", "/fonts/inter-latin-ext-100-normal.woff"],
    "200": ["/fonts/inter-latin-200-normal.woff", "/fonts/inter-latin-ext-200-normal.woff"],
    "300": ["/fonts/inter-latin-300-normal.woff", "/fonts/inter-latin-ext-300-normal.woff"],
    "400": ["/fonts/inter-latin-400-normal.woff", "/fonts/inter-latin-ext-400-normal.woff"],
    "500": ["/fonts/inter-latin-500-normal.woff", "/fonts/inter-latin-ext-500-normal.woff"],
    "600": ["/fonts/inter-latin-600-normal.woff", "/fonts/inter-latin-ext-600-normal.woff"],
    "700": ["/fonts/inter-latin-700-normal.woff", "/fonts/inter-latin-ext-700-normal.woff"],
    "800": ["/fonts/inter-latin-800-normal.woff", "/fonts/inter-latin-ext-800-normal.woff"],
    "900": ["/fonts/inter-latin-900-normal.woff", "/fonts/inter-latin-ext-900-normal.woff"],
    normal: ["/fonts/inter-latin-400-normal.woff", "/fonts/inter-latin-ext-400-normal.woff"],
    bold: ["/fonts/inter-latin-700-normal.woff", "/fonts/inter-latin-ext-700-normal.woff"],
  },
  Roboto: {
    "100": ["/fonts/roboto-latin-100-normal.woff", "/fonts/roboto-latin-ext-100-normal.woff"],
    "200": ["/fonts/roboto-latin-200-normal.woff", "/fonts/roboto-latin-ext-200-normal.woff"],
    "300": ["/fonts/roboto-latin-300-normal.woff", "/fonts/roboto-latin-ext-300-normal.woff"],
    "400": ["/fonts/roboto-latin-400-normal.woff", "/fonts/roboto-latin-ext-400-normal.woff"],
    "500": ["/fonts/roboto-latin-500-normal.woff", "/fonts/roboto-latin-ext-500-normal.woff"],
    "600": ["/fonts/roboto-latin-600-normal.woff", "/fonts/roboto-latin-ext-600-normal.woff"],
    "700": ["/fonts/roboto-latin-700-normal.woff", "/fonts/roboto-latin-ext-700-normal.woff"],
    "800": ["/fonts/roboto-latin-800-normal.woff", "/fonts/roboto-latin-ext-800-normal.woff"],
    "900": ["/fonts/roboto-latin-900-normal.woff", "/fonts/roboto-latin-ext-900-normal.woff"],
    normal: ["/fonts/roboto-latin-400-normal.woff", "/fonts/roboto-latin-ext-400-normal.woff"],
    bold: ["/fonts/roboto-latin-700-normal.woff", "/fonts/roboto-latin-ext-700-normal.woff"],
  },
  Lato: {
    "100": ["/fonts/lato-latin-100-normal.woff", "/fonts/lato-latin-ext-100-normal.woff"],
    "300": ["/fonts/lato-latin-300-normal.woff", "/fonts/lato-latin-ext-300-normal.woff"],
    "400": ["/fonts/lato-latin-400-normal.woff", "/fonts/lato-latin-ext-400-normal.woff"],
    "700": ["/fonts/lato-latin-700-normal.woff", "/fonts/lato-latin-ext-700-normal.woff"],
    "900": ["/fonts/lato-latin-900-normal.woff", "/fonts/lato-latin-ext-900-normal.woff"],
    normal: ["/fonts/lato-latin-400-normal.woff", "/fonts/lato-latin-ext-400-normal.woff"],
    bold: ["/fonts/lato-latin-700-normal.woff", "/fonts/lato-latin-ext-700-normal.woff"],
  },
  "Geist Sans": {
    "100": ["/fonts/geist-sans-latin-100-normal.woff"],
    "200": ["/fonts/geist-sans-latin-200-normal.woff"],
    "300": ["/fonts/geist-sans-latin-300-normal.woff"],
    "400": ["/fonts/geist-sans-latin-400-normal.woff"],
    "500": ["/fonts/geist-sans-latin-500-normal.woff"],
    "600": ["/fonts/geist-sans-latin-600-normal.woff"],
    "700": ["/fonts/geist-sans-latin-700-normal.woff"],
    "800": ["/fonts/geist-sans-latin-800-normal.woff"],
    "900": ["/fonts/geist-sans-latin-900-normal.woff"],
    normal: ["/fonts/geist-sans-latin-400-normal.woff"],
    bold: ["/fonts/geist-sans-latin-700-normal.woff"],
  },
  "Noto Sans": {
    "100": ["/fonts/noto-sans-latin-100-normal.woff", "/fonts/noto-sans-latin-ext-100-normal.woff"],
    "200": ["/fonts/noto-sans-latin-200-normal.woff", "/fonts/noto-sans-latin-ext-200-normal.woff"],
    "300": ["/fonts/noto-sans-latin-300-normal.woff", "/fonts/noto-sans-latin-ext-300-normal.woff"],
    "400": ["/fonts/noto-sans-latin-400-normal.woff", "/fonts/noto-sans-latin-ext-400-normal.woff"],
    "500": ["/fonts/noto-sans-latin-500-normal.woff", "/fonts/noto-sans-latin-ext-500-normal.woff"],
    "600": ["/fonts/noto-sans-latin-600-normal.woff", "/fonts/noto-sans-latin-ext-600-normal.woff"],
    "700": ["/fonts/noto-sans-latin-700-normal.woff", "/fonts/noto-sans-latin-ext-700-normal.woff"],
    "800": ["/fonts/noto-sans-latin-800-normal.woff", "/fonts/noto-sans-latin-ext-800-normal.woff"],
    "900": ["/fonts/noto-sans-latin-900-normal.woff", "/fonts/noto-sans-latin-ext-900-normal.woff"],
    normal: ["/fonts/noto-sans-latin-400-normal.woff", "/fonts/noto-sans-latin-ext-400-normal.woff"],
    bold: ["/fonts/noto-sans-latin-700-normal.woff", "/fonts/noto-sans-latin-ext-700-normal.woff"],
  },
  Oswald: {
    "200": ["/fonts/oswald-latin-200-normal.woff", "/fonts/oswald-latin-ext-200-normal.woff"],
    "300": ["/fonts/oswald-latin-300-normal.woff", "/fonts/oswald-latin-ext-300-normal.woff"],
    "400": ["/fonts/oswald-latin-400-normal.woff", "/fonts/oswald-latin-ext-400-normal.woff"],
    "500": ["/fonts/oswald-latin-500-normal.woff", "/fonts/oswald-latin-ext-500-normal.woff"],
    "600": ["/fonts/oswald-latin-600-normal.woff", "/fonts/oswald-latin-ext-600-normal.woff"],
    "700": ["/fonts/oswald-latin-700-normal.woff", "/fonts/oswald-latin-ext-700-normal.woff"],
    normal: ["/fonts/oswald-latin-400-normal.woff", "/fonts/oswald-latin-ext-400-normal.woff"],
    bold: ["/fonts/oswald-latin-700-normal.woff", "/fonts/oswald-latin-ext-700-normal.woff"],
  },
  Raleway: {
    "100": ["/fonts/raleway-latin-100-normal.woff", "/fonts/raleway-latin-ext-100-normal.woff"],
    "200": ["/fonts/raleway-latin-200-normal.woff", "/fonts/raleway-latin-ext-200-normal.woff"],
    "300": ["/fonts/raleway-latin-300-normal.woff", "/fonts/raleway-latin-ext-300-normal.woff"],
    "400": ["/fonts/raleway-latin-400-normal.woff", "/fonts/raleway-latin-ext-400-normal.woff"],
    "500": ["/fonts/raleway-latin-500-normal.woff", "/fonts/raleway-latin-ext-500-normal.woff"],
    "600": ["/fonts/raleway-latin-600-normal.woff", "/fonts/raleway-latin-ext-600-normal.woff"],
    "700": ["/fonts/raleway-latin-700-normal.woff", "/fonts/raleway-latin-ext-700-normal.woff"],
    "800": ["/fonts/raleway-latin-800-normal.woff", "/fonts/raleway-latin-ext-800-normal.woff"],
    "900": ["/fonts/raleway-latin-900-normal.woff", "/fonts/raleway-latin-ext-900-normal.woff"],
    normal: ["/fonts/raleway-latin-400-normal.woff", "/fonts/raleway-latin-ext-400-normal.woff"],
    bold: ["/fonts/raleway-latin-700-normal.woff", "/fonts/raleway-latin-ext-700-normal.woff"],
  },
  Nunito: {
    "200": ["/fonts/nunito-latin-200-normal.woff", "/fonts/nunito-latin-ext-200-normal.woff"],
    "300": ["/fonts/nunito-latin-300-normal.woff", "/fonts/nunito-latin-ext-300-normal.woff"],
    "400": ["/fonts/nunito-latin-400-normal.woff", "/fonts/nunito-latin-ext-400-normal.woff"],
    "500": ["/fonts/nunito-latin-500-normal.woff", "/fonts/nunito-latin-ext-500-normal.woff"],
    "600": ["/fonts/nunito-latin-600-normal.woff", "/fonts/nunito-latin-ext-600-normal.woff"],
    "700": ["/fonts/nunito-latin-700-normal.woff", "/fonts/nunito-latin-ext-700-normal.woff"],
    "800": ["/fonts/nunito-latin-800-normal.woff", "/fonts/nunito-latin-ext-800-normal.woff"],
    "900": ["/fonts/nunito-latin-900-normal.woff", "/fonts/nunito-latin-ext-900-normal.woff"],
    normal: ["/fonts/nunito-latin-400-normal.woff", "/fonts/nunito-latin-ext-400-normal.woff"],
    bold: ["/fonts/nunito-latin-700-normal.woff", "/fonts/nunito-latin-ext-700-normal.woff"],
  },
  "Nunito Sans": {
    "200": ["/fonts/nunito-sans-latin-200-normal.woff", "/fonts/nunito-sans-latin-ext-200-normal.woff"],
    "300": ["/fonts/nunito-sans-latin-300-normal.woff", "/fonts/nunito-sans-latin-ext-300-normal.woff"],
    "400": ["/fonts/nunito-sans-latin-400-normal.woff", "/fonts/nunito-sans-latin-ext-400-normal.woff"],
    "500": ["/fonts/nunito-sans-latin-500-normal.woff", "/fonts/nunito-sans-latin-ext-500-normal.woff"],
    "600": ["/fonts/nunito-sans-latin-600-normal.woff", "/fonts/nunito-sans-latin-ext-600-normal.woff"],
    "700": ["/fonts/nunito-sans-latin-700-normal.woff", "/fonts/nunito-sans-latin-ext-700-normal.woff"],
    "800": ["/fonts/nunito-sans-latin-800-normal.woff", "/fonts/nunito-sans-latin-ext-800-normal.woff"],
    "900": ["/fonts/nunito-sans-latin-900-normal.woff", "/fonts/nunito-sans-latin-ext-900-normal.woff"],
    normal: ["/fonts/nunito-sans-latin-400-normal.woff", "/fonts/nunito-sans-latin-ext-400-normal.woff"],
    bold: ["/fonts/nunito-sans-latin-700-normal.woff", "/fonts/nunito-sans-latin-ext-700-normal.woff"],
  },
  Rubik: {
    "300": ["/fonts/rubik-latin-300-normal.woff", "/fonts/rubik-latin-ext-300-normal.woff"],
    "400": ["/fonts/rubik-latin-400-normal.woff", "/fonts/rubik-latin-ext-400-normal.woff"],
    "500": ["/fonts/rubik-latin-500-normal.woff", "/fonts/rubik-latin-ext-500-normal.woff"],
    "600": ["/fonts/rubik-latin-600-normal.woff", "/fonts/rubik-latin-ext-600-normal.woff"],
    "700": ["/fonts/rubik-latin-700-normal.woff", "/fonts/rubik-latin-ext-700-normal.woff"],
    "800": ["/fonts/rubik-latin-800-normal.woff", "/fonts/rubik-latin-ext-800-normal.woff"],
    "900": ["/fonts/rubik-latin-900-normal.woff", "/fonts/rubik-latin-ext-900-normal.woff"],
    normal: ["/fonts/rubik-latin-400-normal.woff", "/fonts/rubik-latin-ext-400-normal.woff"],
    bold: ["/fonts/rubik-latin-700-normal.woff", "/fonts/rubik-latin-ext-700-normal.woff"],
  },
};

/**
 * Get or load fonts from cache (supports fallback/compound fonts)
 */
export async function getFont(
  fontFamily: string,
  fontWeight: string | number = "400",
): Promise<opentype.Font[] | null> {
  const fontName = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
  const weight = String(fontWeight);

  // Get font file path (now an array)
  let fontPaths = FONT_FILES[fontName]?.[weight] || FONT_FILES[fontName]?.["400"];

  if (!fontPaths || fontPaths.length === 0) {
    // Fallback to Inter
    fontPaths = FONT_FILES.Inter["400"];
  }

  // Load all
  const loadedFonts: opentype.Font[] = [];

  for (const path of fontPaths) {
    if (fontCache.has(path)) {
      loadedFonts.push(fontCache.get(path)!);
    } else {
      try {
        const font = await opentype.load(path);
        fontCache.set(path, font);
        loadedFonts.push(font);
      } catch (error) {
        console.error("Failed to load font:", path, error);
      }
    }
  }

  if (loadedFonts.length === 0) return null;
  return loadedFonts;
}

/**
 * Iterate over glyphs in text, picking the best font from the list
 */
export function forEachGlyphCompound(
  fonts: opentype.Font[],
  text: string,
  x: number,
  y: number,
  fontSize: number,
  callback: (glyph: opentype.Glyph, x: number, y: number, font: opentype.Font) => void,
) {
  let currentX = x;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Pick font: first one that supports the char (glyph index != 0), or default to first
    const font =
      fonts.find((f) => {
        const glyphIndex = f.charToGlyphIndex(char);
        return glyphIndex > 0;
      }) || fonts[0];

    const glyph = font.charToGlyph(char);
    const scale = fontSize / font.unitsPerEm;

    if (i > 0) {
      const prevChar = text[i - 1];
      // Must resolve prev font again to check if same font (kerning assumption)
      const prevFont = fonts.find((f) => f.charToGlyphIndex(prevChar) > 0) || fonts[0];

      if (prevFont === font) {
        const prevGlyph = font.charToGlyph(prevChar);
        const kerning = font.getKerningValue(prevGlyph, glyph);
        currentX += kerning * scale;
      }
    }

    callback(glyph, currentX, y, font);
    currentX += (glyph.advanceWidth ?? 0) * scale;
  }
}

/**
 * Draw text on a Canvas 2D context using OpenType.js paths
 * Supports compound fonts
 */
export function drawTextWithOpenType(
  ctx: CanvasRenderingContext2D,
  fontOrFonts: opentype.Font | opentype.Font[],
  text: string,
  x: number,
  y: number,
  fontSize: number,
  options?: {
    fill?: string | null;
    stroke?: { color: string; width: number } | null;
  },
): void {
  const fonts = Array.isArray(fontOrFonts) ? fontOrFonts : [fontOrFonts];
  if (fonts.length === 0) return;

  // Use the helper to iterate
  forEachGlyphCompound(fonts, text, x, y, fontSize, (glyph, gx, gy, _font) => {
    const path = glyph.getPath(gx, gy, fontSize);

    // Render path
    ctx.beginPath();
    for (const cmd of path.commands) {
      switch (cmd.type) {
        case "M":
          ctx.moveTo(cmd.x, cmd.y);
          break;
        case "L":
          ctx.lineTo(cmd.x, cmd.y);
          break;
        case "C":
          ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          break;
        case "Q":
          ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          break;
        case "Z":
          ctx.closePath();
          break;
      }
    }

    if (options?.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill("evenodd");
    }
    if (options?.stroke) {
      ctx.strokeStyle = options.stroke.color;
      ctx.lineWidth = options.stroke.width;
      ctx.stroke();
    }
  });
}

/**
 * Get the bounding box of text using OpenType.js
 */
export function getTextBoundsSync(
  fontOrFonts: opentype.Font | opentype.Font[],
  text: string,
  x: number,
  y: number,
  fontSize: number,
): { x: number; y: number; width: number; height: number } {
  const fonts = Array.isArray(fontOrFonts) ? fontOrFonts : [fontOrFonts];
  if (fonts.length === 0) return { x, y, width: 0, height: 0 };

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

/**
 * Get the ascender height for a font at a given size
 */
export function getFontAscender(font: opentype.Font, fontSize: number): number {
  const scale = fontSize / font.unitsPerEm;
  return font.ascender * scale;
}

/**
 * Get the descender depth for a font at a given size
 */
export function getFontDescender(font: opentype.Font, fontSize: number): number {
  const scale = fontSize / font.unitsPerEm;
  return font.descender * scale;
}

/**
 * Preload fonts to avoid flash of unstyled text
 */
export async function preloadFonts(): Promise<void> {
  const fontPaths = new Set<string>();

  for (const family of Object.values(FONT_FILES)) {
    for (const paths of Object.values(family)) {
      for (const p of paths) {
        fontPaths.add(p);
      }
    }
  }

  await Promise.all(
    Array.from(fontPaths).map(async (path) => {
      if (!fontCache.has(path)) {
        try {
          const font = await opentype.load(path);
          fontCache.set(path, font);
        } catch (error) {
          console.error("Failed to preload font:", path, error);
        }
      }
    }),
  );
}

/**
 * Get available weights for a font family
 */
export function getAvailableWeights(fontFamily: string): string[] {
  const fontName = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
  const fontMap = FONT_FILES[fontName];
  if (!fontMap) return ["400", "700"];

  return Object.keys(fontMap)
    .filter((k) => !Number.isNaN(Number(k)))
    .sort((a, b) => Number(a) - Number(b));
}
