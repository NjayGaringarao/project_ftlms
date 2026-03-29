import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const chromiumBinDir = path.join(
  projectRoot,
  "node_modules",
  "@sparticuz",
  "chromium",
  "bin",
);
const publicDir = path.join(projectRoot, "public");
const outputDir = path.join(publicDir, "chromium-pack");
const outputTar = path.join(publicDir, "chromium-pack.tar");

if (!fs.existsSync(chromiumBinDir)) {
  console.warn(
    "[pack-chromium] Skipped: node_modules/@sparticuz/chromium/bin was not found.",
  );
  process.exit(0);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.cpSync(chromiumBinDir, outputDir, { recursive: true });
console.log("[pack-chromium] Copied brotli files to public/chromium-pack");

const tar = spawnSync("tar", ["-cf", outputTar, "-C", chromiumBinDir, "."], {
  stdio: "inherit",
});

if (tar.error || tar.status !== 0) {
  console.error("[pack-chromium] Failed to create public/chromium-pack.tar");
  process.exit(tar.status || 1);
}

console.log("[pack-chromium] Created public/chromium-pack.tar");
