import { createCanvas } from 'canvas';

const imageSize = 1; //px

export function generateColorSample(r: number, g: number, b: number): Buffer {
    const canvas = createCanvas(imageSize, imageSize);
    const ctx = canvas.getContext('2d');
    ctx.antialias = 'none';

    // 引数で渡されたrgb値を基準に、色を塗りつぶす
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.fillRect(0, 0, imageSize, imageSize);

    // canvas.toBuffer()をreturn
    return canvas.toBuffer();
}
