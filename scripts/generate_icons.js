// Pure Node.js script using built-in zlib to create crisp valid PNG icons
import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(width, height, isMaskable = false) {
  // RGBA buffer with filter byte at start of each scanline
  const scanlineWidth = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineWidth * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = x / width;
      const ny = y / height;

      // Base blue gradient background
      let r = Math.round(37 + (29 - 37) * ny);
      let g = Math.round(99 + (78 - 99) * ny);
      let b = Math.round(235 + (216 - 235) * ny);
      let a = 255;

      // Check center building area
      const cx = (nx - 0.5) * 2;
      const cy = (ny - 0.5) * 2;

      // Towers silhouette drawing
      // Left tower: nx between 0.28 and 0.42, ny between 0.42 and 0.75
      if (nx >= 0.28 && nx <= 0.42 && ny >= 0.42 && ny <= 0.75) {
        r = 255; g = 255; b = 255; // White
        // Window dots
        if ((Math.floor(x / (width / 24)) % 2 === 0) && (Math.floor(y / (height / 24)) % 2 === 0)) {
          r = 37; g = 99; b = 235;
        }
      }
      // Right tower: nx between 0.58 and 0.72, ny between 0.38 and 0.75
      else if (nx >= 0.58 && nx <= 0.72 && ny >= 0.38 && ny <= 0.75) {
        r = 255; g = 255; b = 255;
        if ((Math.floor(x / (width / 24)) % 2 === 0) && (Math.floor(y / (height / 24)) % 2 === 0)) {
          r = 37; g = 99; b = 235;
        }
      }
      // Center Grand tower: nx between 0.42 and 0.58, ny between 0.28 and 0.75
      else if (nx >= 0.42 && nx <= 0.58 && ny >= 0.28 && ny <= 0.75) {
        r = 255; g = 255; b = 255;
        // Peak roof: triangle between 0.22 and 0.28
        if ((Math.floor(x / (width / 20)) % 2 === 0) && (Math.floor(y / (height / 20)) % 2 === 0)) {
          r = 29; g = 78; b = 216;
        }
      }
      // Base plinth
      else if (nx >= 0.22 && nx <= 0.78 && ny >= 0.75 && ny <= 0.78) {
        r = 255; g = 255; b = 255;
      }
      // Roof peak gold
      else if (ny >= 0.22 && ny < 0.28 && Math.abs(nx - 0.5) <= (0.28 - ny) * 1.3) {
        r = 250; g = 204; b = 21; // Gold
      }
      // Top star
      else if (Math.hypot(nx - 0.5, ny - 0.16) < 0.035) {
        r = 250; g = 204; b = 21;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Header
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: standard
  ihdrData[12] = 0; // Interlace: none

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = writeChunk('IHDR', ihdrData);
  const compressed = zlib.deflateSync(rawData);
  const idat = writeChunk('IDAT', compressed);
  const iend = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

fs.mkdirSync('public/icons', { recursive: true });

fs.writeFileSync('public/icons/icon-192.png', generatePng(192, 192, false));
fs.writeFileSync('public/icons/icon-512.png', generatePng(512, 512, false));
fs.writeFileSync('public/icons/icon-maskable-192.png', generatePng(192, 192, true));
fs.writeFileSync('public/icons/icon-maskable-512.png', generatePng(512, 512, true));

console.log('Successfully generated all compliant PNG icons!');
