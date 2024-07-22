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
    console.log('Loading image...');
    const image = await loadImage(base64Image);
    console.log('Image loaded:', image.width, image.height);

    // 画像をキャンバスに描画
    ctx.drawImage(image, 0, 0, width, height);
    console.log('Image drawn to canvas');

    // キャンバスをバッファに変換
    const buf = canvas.toBuffer('image/png');
    console.log('Buffer created, length:', buf.length);

    // レスポンスヘッダーの設定とバッファの送信
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(buf);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
