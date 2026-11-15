#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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
    `No Chromium-based browser executable found. Set CHROME_PATH or install Chrome/Chromium.`,
  );
}

function readPngDimensions(buffer) {
  const pngSig = '89504e470d0a1a0a';
  if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === pngSig) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return { width: 1206, height: 2622 };
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

function buildMockupHtml({ dataUri, screenWidthPx, screenHeightPx }) {
  const canvasWidth = 680;
  const screenWidth = 390;
  const screenHeight = Math.round((screenWidth * screenHeightPx) / screenWidthPx);
  const bezel = 12;
  const titaniumFrame = 5;
  const phoneWidth = screenWidth + (bezel + titaniumFrame) * 2;
  const phoneHeight = screenHeight + (bezel + titaniumFrame) * 2;
  const canvasHeight = phoneHeight + 112;

  return {
    canvasWidth,
    canvasHeight,
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
    background: radial-gradient(circle at 30% 20%, #f6faf8 0%, #eaf1ee 58%, #dfe9e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .stage {
    position: relative;
    width: ${phoneWidth}px;
    height: ${phoneHeight}px;
    filter:
      drop-shadow(0 30px 44px rgba(10, 24, 19, 0.22))
      drop-shadow(0 8px 16px rgba(10, 24, 19, 0.12));
  }

  .button-action,
  .button-vol-up,
  .button-vol-down,
  .button-power {
    position: absolute;
    background: linear-gradient(90deg, #5d6261 0%, #8b918f 50%, #4e5352 100%);
    border-radius: 3px;
  }
  .button-action { left: -3px; top: 146px; width: 3px; height: 28px; }
  .button-vol-up { left: -3px; top: 196px; width: 3px; height: 52px; }
  .button-vol-down { left: -3px; top: 262px; width: 3px; height: 52px; }
  .button-power {
    right: -3px;
    top: 214px;
    width: 3px;
    height: 78px;
    background: linear-gradient(270deg, #5d6261 0%, #8b918f 50%, #4e5352 100%);
  }

  .titanium-shell {
    position: relative;
    width: 100%;
    height: 100%;
    padding: ${titaniumFrame}px;
    border-radius: 62px;
    background: linear-gradient(
      145deg,
      #8e9391 0%,
      #5b605e 18%,
      #3b3f3e 45%,
      #6f7573 76%,
      #424745 100%
    );
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.45),
      inset 0 -1px 2px rgba(0, 0, 0, 0.45);
  }

  .bezel {
    position: relative;
    width: 100%;
    height: 100%;
    padding: ${bezel}px;
    border-radius: 57px;
    background: #0c0d0d;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .screen {
    position: relative;
    width: ${screenWidth}px;
    height: ${screenHeight}px;
    border-radius: 45px;
    overflow: hidden;
    background: #000;
  }

  .screen img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dynamic-island {
    position: absolute;
    top: 11px;
    left: 50%;
    transform: translateX(-50%);
    width: 114px;
    height: 32px;
    border-radius: 999px;
    background: #080909;
    box-shadow:
      0 0 0 0.5px rgba(255, 255, 255, 0.08),
      inset 0 1px 2px rgba(255, 255, 255, 0.06);
  }

  .camera-lens {
    position: absolute;
    right: 11px;
    top: 50%;
    transform: translateY(-50%);
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #2f4c73 0%, #111c2b 58%, #070a0f 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="button-action"></div>
    <div class="button-vol-up"></div>
    <div class="button-vol-down"></div>
    <div class="button-power"></div>
    <div class="titanium-shell">
      <div class="bezel">
        <div class="screen">
          <img src="${dataUri}" alt="App screenshot" />
          <div class="dynamic-island">
            <div class="camera-lens"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
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

  const imageBytes = await fsp.readFile(resolvedInput);
  const { width, height } = readPngDimensions(imageBytes);
  const dataUri = `data:${getMimeType(resolvedInput)};base64,${imageBytes.toString('base64')}`;
  const { canvasWidth, canvasHeight, html } = buildMockupHtml({
    dataUri,
    screenWidthPx: width,
    screenHeightPx: height,
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
      '--force-device-scale-factor=2',
      `--window-size=${canvasWidth},${canvasHeight}`,
      `--screenshot=${resolvedOutput}`,
      fileUrl,
    ];

    const result = spawnSync(browser, args, { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(
        `Browser screenshot failed (exit ${result.status}): ${result.stderr || result.stdout}`,
      );
    }
    console.log(`Framed screenshot saved to ${resolvedOutput} (${canvasWidth * 2}x${canvasHeight * 2})`);
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
}

void main();
