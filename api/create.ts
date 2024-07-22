import { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address = '0x0', data = '0' } = req.query;
  console.log(`Creating image for address: ${address} with data: ${data}`);

  // Convert data to number and calculate resolution
  const dataValue = parseInt(data as string, 10);
  const maxValue = 1000;
  const minResolution = 4;
  const maxResolution = 20;

  // Invert the scale so higher data values result in lower resolution
  const resolution = Math.max(
    minResolution,
    Math.min(maxResolution, Math.round(maxResolution - (dataValue / maxValue) * (maxResolution - minResolution))),
  );
  console.log(`Resolution: ${resolution}`);

  const width = 512;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Load image
  const imagePath = path.join(process.cwd(), 'assets', 'images', 'uniswap.png');
  console.log(`Loading image from: ${imagePath}`);
  const image = await loadImage(fs.readFileSync(imagePath));

  // Draw image
  ctx.drawImage(image, 0, 0, width, height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // ASCII conversion
  const cellSize = resolution;
  const asciiChars = ['@', '*', '+', '#', '&', '%', '_', ':', '£', '/', '-', 'X', 'W', ' '];

  // Create a new canvas for ASCII art
  const asciiCanvas = createCanvas(width, height);
  const asciiCtx = asciiCanvas.getContext('2d');
  asciiCtx.fillStyle = 'black'; // 背景を黒に
  asciiCtx.fillRect(0, 0, width, height);
  asciiCtx.font = `${cellSize}px monospace`;
  asciiCtx.fillStyle = 'white'; // 文字を白に

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const pos = (y * width + x) * 4;
      const r = pixels[pos];
      const g = pixels[pos + 1];
      const b = pixels[pos + 2];
      const avg = (r + g + b) / 3;
      const charIndex = Math.floor((avg / 256) * asciiChars.length);
      asciiCtx.fillText(asciiChars[charIndex], x, y + cellSize);
    }
  }

  // Convert canvas to buffer
  const buf = asciiCanvas.toBuffer('image/png');

  // Set response headers and send buffer
  res.setHeader('Content-Type', 'image/png');
  res.status(200).send(buf);
}
