import { VercelRequest, VercelResponse } from '@vercel/node';
import { GlobalFonts, createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address, data } = req.query;
    if (!address || !data) {
      return new Response('Invalid address or value.', { status: 400 });
    }

    // Parse data value and calculate cell size
    const dataValue = parseInt(data as string, 10);
    const maxValue = 1000;
    const minCellSize = 0;
    const maxCellSize = 20;
    const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.round((dataValue / maxValue) * maxCellSize)));

    const width = 512;
    const height = 512;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Register custom font
    const fontPath = path.join(process.cwd(), 'assets/fonts', 'Verdana.ttf');
    GlobalFonts.registerFromPath(fontPath, 'CustomFont');
    console.log(GlobalFonts.families);

    // Load and convert image to Base64
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'uniswap.png');
    console.log('Image path:', imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Load Base64 image
    const image = await loadImage(base64Image);
    console.log('Image loaded:', image.width, image.height);

    // Draw image on canvas
    ctx.drawImage(image, 0, 0, width, height);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    console.log('Image data:', imageData.data);
    const pixels = imageData.data;

    console.log('Starting ASCII conversion');
    console.log('Cell size:', cellSize);
    console.log('Canvas dimensions:', width, 'x', height);

    // Extended ASCII characters
    const asciiChars = ['@', '%', '#', '*', '+', '=', '-', ':', '.', ' ', '&', '_', '£', '/', 'X', 'W'];
    console.log('ASCII characters:', asciiChars);

    const asciiCanvas = createCanvas(width, height);
    const asciiCtx = asciiCanvas.getContext('2d');
    asciiCtx.fillStyle = 'black';
    asciiCtx.fillRect(0, 0, width, height);
    asciiCtx.font = `${cellSize}px Verdana`;
    asciiCtx.textBaseline = 'top';
    let charCounts = {};
    asciiChars.forEach((char) => (charCounts[char] = 0));

    // Function to convert brightness to ASCII symbol
    function convertToSymbol(brightness: number): string {
      const index = Math.floor((brightness / 255) * (asciiChars.length - 1));
      return asciiChars[index];
    }

    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        const pos = (y * width + x) * 4;
        const r = pixels[pos];
        const g = pixels[pos + 1];
        const b = pixels[pos + 2];
        const avg = (r + g + b) / 3;
        const char = convertToSymbol(avg);

        // Count character usage
        charCounts[char]++;

        asciiCtx.fillStyle = `rgb(${r},${g},${b})`;
        asciiCtx.fillText(char, x, y);
      }
    }

    console.log('ASCII character usage:');
    for (const [char, count] of Object.entries(charCounts)) {
      console.log(`'${char}': ${count}`);
    }

    // Check ASCII context content
    const asciiImageData = asciiCtx.getImageData(0, 0, width, height);
    const asciiPixels = asciiImageData.data;

    console.log('First 100 ASCII pixel values:', asciiPixels.slice(0, 400));

    // Add address and data value
    asciiCtx.font = '20px Verdana';
    asciiCtx.fillStyle = 'white';
    asciiCtx.fillText(`Address: ${address}`, 10, 30);
    asciiCtx.fillText(`Data: ${data}`, 10, 60);

    // Convert canvas to buffer
    const buf = asciiCanvas.toBuffer('image/png');
    console.log('Buffer created, length:', buf.length);

    // Set response headers and send buffer
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(buf);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
