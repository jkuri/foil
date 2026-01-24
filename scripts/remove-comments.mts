import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeComments(code: string): string {
  code = code.replace(/(?<!:)\/\/(?!\/)(?!\s*biome-ignore)[^\n]*/g, "");
  code = code.replace(/(^|\n)\s*\{\s*\/\*[\s\S]*?\*\/\s*\}[ \t]*(?=\r?\n|$)/g, "$1");
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");
  code = code.replace(/\n\n\n+/g, "\n\n");
  return code;
}

function findTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git") {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const srcDir: string = path.join(__dirname, "..", "src");
const files: string[] = findTsFiles(srcDir);

console.log(`Found ${files.length} TypeScript/TSX files`);

let processedCount: number = 0;
let errorCount: number = 0;

files.forEach((file) => {
  try {
    const originalContent = fs.readFileSync(file, "utf-8");
    const cleanedContent = removeComments(originalContent);

    if (originalContent !== cleanedContent) {
      fs.writeFileSync(file, cleanedContent, "utf-8");
      processedCount++;
      console.log(`✓ Processed: ${path.relative(srcDir, file)}`);
    }
  } catch (error) {
    errorCount++;
    console.error(`✗ Error processing ${file}:`, (error as Error).message);
  }
});

console.log(`\n✅ Complete! Processed ${processedCount} files`);
if (errorCount > 0) {
  console.log(`⚠️  ${errorCount} files had errors`);
}
