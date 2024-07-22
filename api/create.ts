import { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address = '0x0', data = '0', option } = req.query;

    const dataValue = parseInt(data as string, 10);
    const maxValue = 1000;
    const minCellSize = 4;
    const maxCellSize = 20;
    const cellSize = Math.max(
      minCellSize,
      Math.min(maxCellSize, Math.round(minCellSize + (dataValue / maxValue) * (maxCellSize - minCellSize))),
    );

    const width = 512;
    const height = 512;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 画像ファイルを読み込み、Base64に変換
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'uniswap.png');
    console.log('Image path:', imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    if (!option) {
      return res.status(200).json({ base64Image });
    }
    // Base64画像を読み込み
    const image = await loadImage(base64Image);
    console.log('Image loaded:', image.width, image.height);

    // 画像の描画
    ctx.drawImage(image, 0, 0, width, height);

    // ピクセルデータの取得
    const imageData = ctx.getImageData(0, 0, width, height);
    console.log('Image data:', imageData.data);
    const pixels = imageData.data;

    console.log('Starting ASCII conversion');
    console.log('Cell size:', cellSize);
    console.log('Canvas dimensions:', width, 'x', height);

    const asciiChars = ['@', '%', '#', '*', '+', '=', '-', ':', '.', ' '];
    console.log('ASCII characters:', asciiChars);

    const asciiCanvas = createCanvas(width, height);
    const asciiCtx = asciiCanvas.getContext('2d');
    // asciiCtx.fillStyle = 'black';
    // asciiCtx.fillRect(0, 0, width, height);
    // asciiCtx.font = `${cellSize}px monospace`;
    // asciiCtx.textBaseline = 'top';

    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        const pos = (y * width + x) * 4;
        const r = pixels[pos];
        const g = pixels[pos + 1];
        const b = pixels[pos + 2];
        const avg = (r + g + b) / 3;
        const charIndex = Math.floor((avg / 255) * (asciiChars.length - 1));
        const char = asciiChars[charIndex];

        asciiCtx.fillStyle = `rgb(${r},${g},${b})`;
        asciiCtx.fillText(char, x, y);
      }
    }

    // asciiCtxの内容を確認
    const asciiImageData = asciiCtx.getImageData(0, 0, width, height);
    const asciiPixels = asciiImageData.data;
    console.log('First 100 ASCII pixel values:', asciiPixels.slice(0, 400)); // RGBAなので400個表示

    // アドレスとデータ値の追加
    // asciiCtx.font = '20px Arial';
    // asciiCtx.fillStyle = 'white';
    // asciiCtx.fillText(`Address: ${address}`, 10, 30);
    // asciiCtx.fillText(`Data: ${data}`, 10, 60);

    // キャンバスをバッファに変換
    const buf = asciiCanvas.toBuffer('image/png');
    console.log('Buffer created, length:', buf.length);

    // レスポンスヘッダーの設定とバッファの送信
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(buf);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
