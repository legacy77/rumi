/* Generates placeholder RUMI icons: terracotta rounded square + white "r".
 * Pure Node (zlib only), no external downloads. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const TERRA = [0xd9, 0x77, 0x57, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(pixels, w, h) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const p = pixels[y * w + x];
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(n) {
  const px = new Array(n * n).fill(CLEAR);
  const r = Math.round(n * 0.225);
  const set = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < n && y < n) px[y * n + x] = c;
  };
  // Terracotta rounded square (full bleed)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const cx = Math.min(x, n - 1 - x);
      const cy = Math.min(y, n - 1 - y);
      const inside =
        cx >= r || cy >= r ||
        (cx - r) ** 2 + (cy - r) ** 2 <= r * r ||
        (x >= r && x < n - r) || (y >= r && y < n - r);
      if (inside || x >= r || y >= r) {
        // simpler: pixel is inside unless in a corner cut-out circle
        let cut = false;
        if (cx < r && cy < r) {
          const dx = r - cx, dy = r - cy;
          cut = dx * dx + dy * dy > r * r;
        }
        if (!cut) set(x, y, TERRA);
      }
    }
  }
  // White lowercase "r": stem + shoulder arch
  const rect = (x0, y0, x1, y1) => {
    for (let y = Math.round(y0 * n); y < Math.round(y1 * n); y++)
      for (let x = Math.round(x0 * n); x < Math.round(x1 * n); x++) set(x, y, WHITE);
  };
  rect(0.34, 0.28, 0.44, 0.72); // stem
  rect(0.34, 0.38, 0.68, 0.47); // shoulder top bar
  rect(0.59, 0.38, 0.68, 0.62); // shoulder right leg
  return px;
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const buf = encodePng(drawIcon(size), size, size);
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file} (${buf.length} bytes)`);
}
