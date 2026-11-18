#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const IPHONE_FRAME_PATH = path.join(SCRIPT_DIR, 'iphone-18-pro-max-frame.png');
const IPHONE_FRAME_WIDTH = 900;
const IPHONE_FRAME_HEIGHT = 1715;
const IPHONE_SCREEN_RECT = { left: 98, top: 77, width: 704, height: 1529, radius: 96 };

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

function readImageDimensions(buffer) {
  const pngSig = '89504e470d0a1a0a';
  if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === pngSig) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return { width: 1024, height: 715 };
}

function buildIphoneHtml({ screenDataUri, frameDataUri }) {
  return {
    width: IPHONE_FRAME_WIDTH,
    height: IPHONE_FRAME_HEIGHT,
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${IPHONE_FRAME_WIDTH}px;
    height: ${IPHONE_FRAME_HEIGHT}px;
    overflow: hidden;
    background: transparent;
  }
  .canvas {
    position: relative;
    width: ${IPHONE_FRAME_WIDTH}px;
    height: ${IPHONE_FRAME_HEIGHT}px;
  }
  .screen {
    position: absolute;
    left: ${IPHONE_SCREEN_RECT.left}px;
    top: ${IPHONE_SCREEN_RECT.top}px;
    width: ${IPHONE_SCREEN_RECT.width}px;
    height: ${IPHONE_SCREEN_RECT.height}px;
    border-radius: ${IPHONE_SCREEN_RECT.radius}px;
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
    width: ${IPHONE_FRAME_WIDTH}px;
    height: ${IPHONE_FRAME_HEIGHT}px;
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
</html>`,
  };
}

function buildIpadHtml({ screenDataUri, screenWidth, screenHeight }) {
  const targetScreenWidth = 1120;
  const targetScreenHeight = Math.round((targetScreenWidth * screenHeight) / screenWidth);
  const bezelPadding = 32;
  const shellPadding = 7;
  const bodyWidth = targetScreenWidth + (bezelPadding + shellPadding) * 2;
  const bodyHeight = targetScreenHeight + (bezelPadding + shellPadding) * 2;
  const marginX = 64;
  const marginTop = 44;
  const marginBottom = 76;
  const canvasWidth = bodyWidth + marginX * 2;
  const canvasHeight = bodyHeight + marginTop + marginBottom;

  return {
    width: canvasWidth,
    height: canvasHeight,
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${canvasWidth}px;
    height: ${canvasHeight}px;
    overflow: hidden;
    background: transparent;
  }
  .canvas {
    width: ${canvasWidth}px;
    height: ${canvasHeight}px;
    padding: ${marginTop}px ${marginX}px ${marginBottom}px ${marginX}px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .device {
    position: relative;
    width: ${bodyWidth}px;
    height: ${bodyHeight}px;
    filter:
      drop-shadow(0 22px 32px rgba(0, 0, 0, 0.28))
      drop-shadow(0 6px 14px rgba(0, 0, 0, 0.16));
  }
  .btn-top-vol-1,
  .btn-top-vol-2,
  .btn-side-power {
    position: absolute;
    background: linear-gradient(180deg, #4f5256 0%, #242628 50%, #101112 100%);
    border-radius: 2px;
  }
  .btn-top-vol-1 {
    top: -3px;
    right: 120px;
    width: 44px;
    height: 3px;
  }
  .btn-top-vol-2 {
    top: -3px;
    right: 68px;
    width: 44px;
    height: 3px;
  }
  .btn-side-power {
    top: 66px;
    right: -3px;
    width: 3px;
    height: 52px;
    background: linear-gradient(90deg, #101112 0%, #4b4e52 50%, #1f2123 100%);
  }
  .shell {
    position: relative;
    width: 100%;
    height: 100%;
    padding: ${shellPadding}px;
    border-radius: 46px;
    background: linear-gradient(
      142deg,
      #54575b 0%,
      #222426 12%,
      #101113 38%,
      #34373a 62%,
      #141517 86%,
      #4a4d51 100%
    );
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.34),
      inset 0 -1px 2px rgba(0, 0, 0, 0.85),
      0 0 0 1px rgba(0, 0, 0, 0.72);
  }
  .bezel {
    position: relative;
    width: 100%;
    height: 100%;
    padding: ${bezelPadding}px;
    border-radius: 40px;
    background: linear-gradient(180deg, #0b0c0d 0%, #050506 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 2px 6px rgba(0, 0, 0, 0.9);
  }
  .camera-array {
    position: absolute;
    top: 11px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .camera-lens {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 35%, #3c5f8c 0%, #15253a 58%, #06090e 100%);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 1px 1px rgba(255, 255, 255, 0.25);
  }
  .camera-sensor {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #14161a;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  .screen {
    width: ${targetScreenWidth}px;
    height: ${targetScreenHeight}px;
    border-radius: 22px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 0 0 0.75px rgba(255, 255, 255, 0.06);
  }
  .screen img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="device">
      <div class="btn-top-vol-1"></div>
      <div class="btn-top-vol-2"></div>
      <div class="btn-side-power"></div>
      <div class="shell">
        <div class="bezel">
          <div class="camera-array">
            <div class="camera-sensor"></div>
            <div class="camera-lens"></div>
          </div>
          <div class="screen">
            <img src="${screenDataUri}" alt="App screenshot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

function parseArgs(argv) {
  const positional = [];
  let device = 'iphone';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--device' && i + 1 < argv.length) {
      device = argv[++i].toLowerCase();
    } else if (arg.startsWith('--device=')) {
      device = arg.slice('--device='.length).toLowerCase();
    } else {
      positional.push(arg);
    }
  }
  return { inputPath: positional[0], outputPath: positional[1], device };
}

async function main() {
  const { inputPath, outputPath, device } = parseArgs(process.argv.slice(2));

  if (!inputPath || !outputPath || !['iphone', 'ipad'].includes(device)) {
    console.error(
      'Usage: node scripts/frame-screenshot.mjs <input-image> <output-png> [--device iphone|ipad]',
    );
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);

  const screenBytes = await fsp.readFile(resolvedInput);
  const screenDataUri = `data:${getMimeType(resolvedInput)};base64,${screenBytes.toString('base64')}`;

  let composite;
  if (device === 'ipad') {
    const { width, height } = readImageDimensions(screenBytes);
    composite = buildIpadHtml({ screenDataUri, screenWidth: width, screenHeight: height });
  } else {
    const frameBytes = await fsp.readFile(IPHONE_FRAME_PATH);
    const frameDataUri = `data:image/png;base64,${frameBytes.toString('base64')}`;
    composite = buildIphoneHtml({ screenDataUri, frameDataUri });
  }

  const browser = findBrowserExecutable();
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'mensa-frame-'));
  const htmlPath = path.join(tempDir, 'mockup.html');
  await fsp.writeFile(htmlPath, composite.html, 'utf8');
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
      `--window-size=${composite.width},${composite.height}`,
      `--screenshot=${resolvedOutput}`,
      fileUrl,
    ];

    const result = spawnSync(browser, args, { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(
        `Browser screenshot failed (exit ${result.status}): ${result.stderr || result.stdout}`,
      );
    }
    console.log(
      `Framed ${device} screenshot saved to ${resolvedOutput} (${composite.width}x${composite.height})`,
    );
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
}

void main();
