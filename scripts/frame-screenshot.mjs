#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRAME_PATH = path.join(SCRIPT_DIR, 'iphone-18-pro-max-frame.png');
const FRAME_WIDTH = 900;
const FRAME_HEIGHT = 1715;
const SCREEN_RECT = { left: 98, top: 77, width: 704, height: 1529, radius: 96 };

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

function findBrowserExecutable() {
  for (const candidate of BROWSER_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    'No Chromium-based browser executable found. Set CHROME_PATH or install Chrome/Chromium.',
  );
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    return 'image/jpeg';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  return 'image/png';
}

function buildCompositeHtml({ screenDataUri, frameDataUri }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${FRAME_WIDTH}px;
    height: ${FRAME_HEIGHT}px;
    overflow: hidden;
    background: transparent;
  }
  .canvas {
    position: relative;
    width: ${FRAME_WIDTH}px;
    height: ${FRAME_HEIGHT}px;
  }
  .screen {
    position: absolute;
    left: ${SCREEN_RECT.left}px;
    top: ${SCREEN_RECT.top}px;
    width: ${SCREEN_RECT.width}px;
    height: ${SCREEN_RECT.height}px;
    border-radius: ${SCREEN_RECT.radius}px;
    overflow: hidden;
  }
  .screen img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .bezel {
    position: absolute;
    inset: 0;
    width: ${FRAME_WIDTH}px;
    height: ${FRAME_HEIGHT}px;
    display: block;
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="screen">
      <img src="${screenDataUri}" alt="App screenshot" />
    </div>
    <img class="bezel" src="${frameDataUri}" alt="" />
  </div>
</body>
</html>`;
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/frame-screenshot.mjs <input-image> <output-png>');
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);

  const [screenBytes, frameBytes] = await Promise.all([
    fsp.readFile(resolvedInput),
    fsp.readFile(FRAME_PATH),
  ]);

  const html = buildCompositeHtml({
    screenDataUri: `data:${getMimeType(resolvedInput)};base64,${screenBytes.toString('base64')}`,
    frameDataUri: `data:image/png;base64,${frameBytes.toString('base64')}`,
  });

  const browser = findBrowserExecutable();
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'mensa-frame-'));
  const htmlPath = path.join(tempDir, 'mockup.html');
  await fsp.writeFile(htmlPath, html, 'utf8');
  await fsp.mkdir(path.dirname(resolvedOutput), { recursive: true });

  try {
    const fileUrl = new URL(`file:///${htmlPath.replace(/\\/g, '/')}`).href;
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--default-background-color=00000000',
      '--force-device-scale-factor=1',
      `--window-size=${FRAME_WIDTH},${FRAME_HEIGHT}`,
      `--screenshot=${resolvedOutput}`,
      fileUrl,
    ];

    const result = spawnSync(browser, args, { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(
        `Browser screenshot failed (exit ${result.status}): ${result.stderr || result.stdout}`,
      );
    }
    console.log(`Framed screenshot saved to ${resolvedOutput} (${FRAME_WIDTH}x${FRAME_HEIGHT})`);
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
}

void main();
