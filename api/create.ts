import { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address = '0x0', data = '0' } = req.query;

  // データ値をセルサイズに変換
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

  const imagePath = path.join(process.cwd(), 'assets', 'images', 'uniswap.png');
  const image = await loadImage(fs.readFileSync(imagePath));

  // 画像の描画
  ctx.drawImage(image, 0, 0, width, height);

  // ピクセルデータの取得
  const imageData = ctx.getImageData(0, 0, width, height);
  console.log('imageData', imageData);
  const pixels = imageData.data;

  // ASCII変換
  const asciiChars = ['@', '*', '+', '#', '&', '%', '_', ':', '£', '/', '-', 'X', 'W', ' '];

  // ASCIIアート用の新しいキャンバス
  const asciiCanvas = createCanvas(width, height);
  const asciiCtx = asciiCanvas.getContext('2d');
  asciiCtx.fillStyle = 'black';
  asciiCtx.fillRect(0, 0, width, height);
  asciiCtx.font = `${cellSize}px monospace`;

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const pos = (y * width + x) * 4;
      const r = pixels[pos];
      const g = pixels[pos + 1];
      const b = pixels[pos + 2];
      const avg = (r + g + b) / 3;
      const charIndex = Math.floor((avg / 256) * asciiChars.length);
      const color = `rgb(${r},${g},${b})`;
      asciiCtx.fillStyle = color;
      asciiCtx.fillText(asciiChars[charIndex], x, y + cellSize);
    }
  }

  // アドレスとデータ値の追加
  asciiCtx.font = '20px Arial';
  asciiCtx.fillStyle = 'white';
  asciiCtx.fillText(`Address: ${address}`, 10, 30);
  asciiCtx.fillText(`Data: ${data}`, 10, 60);

  // キャンバスをバッファに変換
  const buf = asciiCanvas.toBuffer('image/png');

  // レスポンスヘッダーの設定とバッファの送信
  res.setHeader('Content-Type', 'image/png');
  res.status(200).send(buf);
}
