const fs = require('fs');
const path = require('path');

const WIDTH = 720;
const HEIGHT = 480;
const MIN_CODE_SIZE = 4;

const palette = [
  [0, 0, 0],
  [248, 161, 52],
  [232, 122, 32],
  [200, 94, 24],
  [255, 220, 163],
  [42, 26, 16],
  [125, 60, 22],
  [248, 194, 139],
  [255, 243, 213],
  [217, 107, 28],
  [173, 78, 20],
  [240, 180, 91],
  [255, 255, 255],
  [51, 29, 14],
  [239, 133, 38],
  [146, 68, 18]
];

class Raster {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height);
  }

  setPixel(x, y, color) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    this.pixels[iy * this.width + ix] = color;
  }

  fillEllipse(cx, cy, rx, ry, color, rotation = 0) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const radius = Math.ceil(Math.max(rx, ry) + 2);
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const xr = cos * dx + sin * dy;
        const yr = -sin * dx + cos * dy;
        if ((xr * xr) / (rx * rx) + (yr * yr) / (ry * ry) <= 1) {
          this.pixels[y * this.width + x] = color;
        }
      }
    }
  }

  fillPolygon(points, color) {
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...ys)));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (pointInPolygon(x + 0.5, y + 0.5, points)) {
          this.pixels[y * this.width + x] = color;
        }
      }
    }
  }

  thickLine(x1, y1, x2, y2, thickness, color) {
    const radius = thickness / 2;
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - radius - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(x1, x2) + radius + 1));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - radius - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(y1, y2) + radius + 1));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy || 1;

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - x1) * dx + (y + 0.5 - y1) * dy) / lengthSq));
        const px = x1 + t * dx;
        const py = y1 + t * dy;
        const distSq = (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2;
        if (distSq <= radius * radius) {
          this.pixels[y * this.width + x] = color;
        }
      }
    }
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawEar(raster, cx, cy, flip = 1) {
  raster.fillPolygon([
    [cx - 36 * flip, cy + 35],
    [cx + 2 * flip, cy - 46],
    [cx + 46 * flip, cy + 36]
  ], 2);
  raster.fillPolygon([
    [cx - 19 * flip, cy + 25],
    [cx + 2 * flip, cy - 20],
    [cx + 27 * flip, cy + 25]
  ], 7);
}

function drawFace(raster, cx, cy, phase, resting = false) {
  raster.fillEllipse(cx, cy, 90, 78, 1, 0.05);
  raster.fillEllipse(cx + 20, cy + 16, 58, 46, 11, 0.1);
  drawEar(raster, cx - 48, cy - 57, 1);
  drawEar(raster, cx + 48, cy - 57, -1);
  raster.thickLine(cx - 20, cy - 65, cx - 28, cy - 25, 13, 10);
  raster.thickLine(cx + 5, cy - 68, cx + 11, cy - 27, 13, 10);

  if (resting) {
    raster.thickLine(cx - 36, cy + 0, cx - 16, cy + 0, 6, 5);
    raster.thickLine(cx + 28, cy + 0, cx + 48, cy + 0, 6, 5);
  } else {
    const blink = Math.sin(phase * 0.5) > 0.985;
    raster.fillEllipse(cx - 28, cy + 0, 7, blink ? 2 : 12, 5);
    raster.fillEllipse(cx + 39, cy + 0, 7, blink ? 2 : 12, 5);
  }

  raster.fillEllipse(cx + 8, cy + 19, 8, 6, 6);
  raster.thickLine(cx + 8, cy + 24, cx - 3, cy + 34, 4, 6);
  raster.thickLine(cx + 8, cy + 24, cx + 22, cy + 34, 4, 6);
  raster.thickLine(cx - 70, cy + 22, cx - 122, cy + 10, 3, 6);
  raster.thickLine(cx - 72, cy + 34, cx - 126, cy + 34, 3, 6);
  raster.thickLine(cx + 62, cy + 23, cx + 116, cy + 12, 3, 6);
  raster.thickLine(cx + 64, cy + 35, cx + 120, cy + 35, 3, 6);
}

function drawWalkFrame(index, total) {
  const raster = new Raster(WIDTH, HEIGHT);
  const phase = (index / total) * Math.PI * 2;
  const bob = Math.sin(phase * 2) * 7;
  const sway = Math.sin(phase) * 12;

  raster.thickLine(196, 282 + bob, 112, 238 + bob + Math.sin(phase) * 16, 38, 9);
  raster.thickLine(112, 238 + bob + Math.sin(phase) * 16, 90, 186 + bob + Math.cos(phase) * 20, 34, 9);
  raster.fillEllipse(88, 184 + bob + Math.cos(phase) * 20, 32, 28, 9, -0.3);

  drawWalkingLeg(raster, 285, 330 + bob, phase + Math.PI, 2);
  drawWalkingLeg(raster, 435, 328 + bob, phase, 2);
  drawWalkingLeg(raster, 345, 338 + bob, phase + Math.PI * 0.45, 14);
  drawWalkingLeg(raster, 500, 334 + bob, phase + Math.PI * 1.25, 14);

  raster.fillEllipse(350, 280 + bob, 188, 92, 1, 0.03);
  raster.fillEllipse(386, 304 + bob, 90, 58, 4, 0.05);
  raster.fillEllipse(288, 239 + bob, 54, 40, 11, 0.18);
  raster.fillEllipse(410, 224 + bob, 44, 34, 11, -0.18);
  raster.thickLine(282, 210 + bob, 268, 260 + bob, 17, 10);
  raster.thickLine(338, 198 + bob, 331, 248 + bob, 17, 10);
  raster.thickLine(398, 204 + bob, 414, 250 + bob, 17, 10);

  drawFace(raster, 545 + sway * 0.2, 207 + bob, phase, false);

  return raster.pixels;
}

function drawWalkingLeg(raster, x, y, phase, color) {
  const swing = Math.sin(phase) * 0.65;
  const kneeX = x + Math.sin(swing) * 28;
  const kneeY = y + 44;
  const pawX = kneeX + Math.sin(swing * 0.9) * 48;
  const pawY = y + 92 + Math.abs(Math.sin(phase)) * 9;
  raster.thickLine(x, y, kneeX, kneeY, 28, color);
  raster.thickLine(kneeX, kneeY, pawX, pawY, 24, color);
  raster.fillEllipse(pawX + 18, pawY + 5, 34, 17, color, 0.08);
}

function drawRestFrame(index, total) {
  const raster = new Raster(WIDTH, HEIGHT);
  const phase = (index / total) * Math.PI * 2;
  const breath = Math.sin(phase) * 5;
  const tailLift = Math.sin(phase * 0.7) * 5;

  raster.thickLine(244, 328 + breath, 146, 326 + tailLift, 36, 9);
  raster.thickLine(146, 326 + tailLift, 110, 278 + tailLift, 32, 9);
  raster.fillEllipse(105, 274 + tailLift, 31, 24, 9, -0.4);

  raster.fillEllipse(360, 327 + breath, 250, 80, 1, -0.03);
  raster.fillEllipse(380, 338 + breath, 130, 50, 4, -0.02);
  raster.fillEllipse(250, 294 + breath, 56, 36, 11, 0.14);
  raster.fillEllipse(350, 272 + breath, 52, 34, 11, -0.08);
  raster.thickLine(276, 250 + breath, 262, 302 + breath, 18, 10);
  raster.thickLine(345, 244 + breath, 351, 294 + breath, 18, 10);
  raster.thickLine(414, 251 + breath, 430, 300 + breath, 18, 10);
  raster.fillEllipse(312, 376 + breath, 74, 20, 2, 0.02);
  raster.fillEllipse(492, 371 + breath, 82, 20, 14, -0.05);

  drawFace(raster, 520, 260 + breath, phase, true);

  return raster.pixels;
}

function frameDelay(index) {
  return [2, 2, 1][index % 3];
}

function makeFrames(count, drawFrame) {
  const frames = [];
  const delays = [];
  for (let index = 0; index < count; index += 1) {
    frames.push(drawFrame(index, count));
    delays.push(frameDelay(index));
  }
  return { frames, delays };
}

class BitWriter {
  constructor() {
    this.bytes = [];
    this.current = 0;
    this.bitCount = 0;
  }

  write(code, size) {
    this.current |= code << this.bitCount;
    this.bitCount += size;
    while (this.bitCount >= 8) {
      this.bytes.push(this.current & 0xff);
      this.current >>= 8;
      this.bitCount -= 8;
    }
  }

  finish() {
    if (this.bitCount > 0) {
      this.bytes.push(this.current & 0xff);
      this.current = 0;
      this.bitCount = 0;
    }
    return this.bytes;
  }
}

function lzwEncode(pixels) {
  const clearCode = 1 << MIN_CODE_SIZE;
  const endCode = clearCode + 1;
  let nextCode = endCode + 1;
  let codeSize = MIN_CODE_SIZE + 1;
  const dict = new Map();
  const writer = new BitWriter();

  const writeCode = (code) => {
    writer.write(code, codeSize);
    if (nextCode > (1 << codeSize) - 1 && codeSize < 12) {
      codeSize += 1;
    }
  };

  writer.write(clearCode, codeSize);
  let prefix = pixels[0];

  for (let index = 1; index < pixels.length; index += 1) {
    const char = pixels[index];
    const key = prefix * 256 + char;

    if (dict.has(key)) {
      prefix = dict.get(key);
      continue;
    }

    writeCode(prefix);

    if (nextCode < 4096) {
      dict.set(key, nextCode);
      nextCode += 1;
    } else {
      writer.write(clearCode, codeSize);
      dict.clear();
      nextCode = endCode + 1;
      codeSize = MIN_CODE_SIZE + 1;
    }

    prefix = char;
  }

  writeCode(prefix);
  writer.write(endCode, codeSize);
  return writer.finish();
}

function writeWord(bytes, value) {
  bytes.push(value & 0xff, (value >> 8) & 0xff);
}

function writeSubBlocks(bytes, data) {
  for (let index = 0; index < data.length; index += 255) {
    const block = data.slice(index, index + 255);
    bytes.push(block.length, ...block);
  }
  bytes.push(0);
}

function encodeGif(outputPath, frames, delays) {
  const bytes = [];
  bytes.push(...Buffer.from('GIF89a', 'ascii'));
  writeWord(bytes, WIDTH);
  writeWord(bytes, HEIGHT);
  bytes.push(0xf3, 0, 0);

  for (const color of palette) {
    bytes.push(...color);
  }

  bytes.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0', 'ascii'), 0x03, 0x01, 0x00, 0x00, 0x00);

  frames.forEach((pixels, index) => {
    bytes.push(0x21, 0xf9, 0x04, 0x09);
    writeWord(bytes, delays[index]);
    bytes.push(0, 0);
    bytes.push(0x2c);
    writeWord(bytes, 0);
    writeWord(bytes, 0);
    writeWord(bytes, WIDTH);
    writeWord(bytes, HEIGHT);
    bytes.push(0);
    bytes.push(MIN_CODE_SIZE);
    writeSubBlocks(bytes, lzwEncode(pixels));
  });

  bytes.push(0x3b);
  fs.writeFileSync(outputPath, Buffer.from(bytes));
}

function main() {
  const assetDir = path.join(__dirname, '..', 'src', 'assets');
  fs.mkdirSync(assetDir, { recursive: true });

  const walk = makeFrames(60, drawWalkFrame);
  const rest = makeFrames(120, drawRestFrame);
  const walkPath = path.join(assetDir, 'orange-cat-walk-60fps.gif');
  const restPath = path.join(assetDir, 'orange-cat-rest-60fps.gif');

  encodeGif(walkPath, walk.frames, walk.delays);
  encodeGif(restPath, rest.frames, rest.delays);

  console.log(`Generated ${walkPath}`);
  console.log(`Generated ${restPath}`);
  console.log('GIF delay pattern is 2cs, 2cs, 1cs, averaging 60 frames per second.');
}

main();
