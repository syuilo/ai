import gen from 'random-seed';
import { createCanvas } from 'canvas';

import { CellType } from './maze.js';
import { themes } from './themes.js';

const imageSize = 4096; // px
const margin = 96 * 4;
const mazeAreaSize = imageSize - (margin * 2);

export function renderMaze(seed, maze: CellType[][]) {
	const rand = gen.create(seed);
	const mazeSize = maze.length;

	const colors = themes[rand(themes.length)];

	const canvas = createCanvas(imageSize, imageSize);
	const ctx = canvas.getContext('2d');
	ctx.antialias = 'none';

	ctx.fillStyle = colors.bg1;
	ctx.beginPath();
	ctx.fillRect(0, 0, imageSize, imageSize);

	ctx.fillStyle = colors.bg2;
	ctx.beginPath();
	ctx.fillRect(margin / 2, margin / 2, imageSize - ((margin / 2) * 2), imageSize - ((margin / 2) * 2));

	// Draw
	function drawCell(ctx, x, y, size, left, right, top, bottom, mark) {
		const wallThickness = size / 6;
		const margin = size / 6;
		const markerMargin = size / 3;

		ctx.fillStyle = colors.road;
		if (left) {
			ctx.beginPath();
			ctx.fillRect(x, y + margin, size - margin, size - (margin * 2));
		}
		if (right) {
			ctx.beginPath();
			ctx.fillRect(x + margin, y + margin, size - margin, size - (margin * 2));
		}
		if (top) {
			ctx.beginPath();
			ctx.fillRect(x + margin, y, size - (margin * 2), size - margin);
		}
		if (bottom) {
			ctx.beginPath();
			ctx.fillRect(x + margin, y + margin, size - (margin * 2), size - margin);
		}

		if (mark) {
			ctx.fillStyle = colors.marker;
			ctx.beginPath();
			ctx.fillRect(x + markerMargin, y + markerMargin, size - (markerMargin * 2), size - (markerMargin * 2));
		}

		ctx.strokeStyle = colors.wall;
		ctx.lineWidth = wallThickness;
		ctx.lineCap = 'square';

		function line(ax, ay, bx, by) {
			ctx.beginPath();
			ctx.lineTo(x + ax, y + ay);
			ctx.lineTo(x + bx, y + by);
			ctx.stroke();
		}

		if (left && right && top && bottom) {
			ctx.beginPath();
			if (rand(2) === 0) {
				line(0, margin, size, margin); // ─ 上
				line(0, size - margin, size, size - margin); // ─ 下
				line(margin, 0, margin, margin); // │ 左上
				line(size - margin, 0, size - margin, margin); // │ 右上
				line(margin, size - margin, margin, size); // │ 左下
				line(size - margin, size - margin, size - margin, size); // │ 右下
			} else {
				line(margin, 0, margin, size); // │ 左
				line(size - margin, 0, size - margin, size); // │ 右
				line(0, margin, margin, margin); // ─ 左上
				line(size - margin, margin, size, margin); // ─ 右上
				line(0, size - margin, margin, size - margin); // ─ 左下
				line(size - margin, size - margin, size, size - margin); // ─ 右下
			}
			return;
		}

		// ─
		if (left && right && !top && !bottom) {
			line(0, margin, size, margin); // ─ 上
			line(0, size - margin, size, size - margin); // ─ 下
			return;
		}

		// │
		if (!left && !right && top && bottom) {
			line(margin, 0, margin, size); // │ 左
			line(size - margin, 0, size - margin, size); // │ 右
			return;
		}

		// 左行き止まり
		if (!left && right && !top && !bottom) {
			line(margin, margin, size, margin); // ─ 上
			line(margin, margin, margin, size - margin); // │ 左
			line(margin, size - margin, size, size - margin); // ─ 下
			return;
		}

		// 右行き止まり
		if (left && !right && !top && !bottom) {
			line(0, margin, size - margin, margin); // ─ 上
			line(size - margin, margin, size - margin, size - margin); // │ 右
			line(0, size - margin, size - margin, size - margin); // ─ 下
			return;
		}

		// 上行き止まり
		if (!left && !right && !top && bottom) {
			line(margin, margin, size - margin, margin); // ─ 上
			line(margin, margin, margin, size); // │ 左
			line(size - margin, margin, size - margin, size); // │ 右
			return;
		}

		// 下行き止まり
		if (!left && !right && top && !bottom) {
			line(margin, size - margin, size - margin, size - margin); // ─ 下
			line(margin, 0, margin, size - margin); // │ 左
			line(size - margin, 0, size - margin, size - margin); // │ 右
			return;
		}

		// ┌
		if (!left && !top && right && bottom) {
			line(margin, margin, size, margin); // ─ 上
			line(margin, margin, margin, size); // │ 左
			line(size - margin, size - margin, size, size - margin); // ─ 下
			line(size - margin, size - margin, size - margin, size); // │ 右
			return;
		}

		// ┐
		if (left && !right && !top && bottom) {
			line(0, margin, size - margin, margin); // ─ 上
			line(size - margin, margin, size - margin, size); // │ 右
			line(0, size - margin, margin, size - margin); // ─ 下
			line(margin, size - margin, margin, size); // │ 左
			return;
		}

		// └
		if (!left && right && top && !bottom) {
			line(margin, 0, margin, size - margin); // │ 左
			line(margin, size - margin, size, size - margin); // ─ 下
			line(size - margin, 0, size - margin, margin); // │ 右
			line(size - margin, margin, size, margin); // ─ 上
			return;
		}

		// ┘
		if (left && !right && top && !bottom) {
			line(margin, 0, margin, margin); // │ 左
			line(0, margin, margin, margin); // ─ 上
			line(size - margin, 0, size - margin, size - margin); // │ 右
			line(0, size - margin, size - margin, size - margin); // ─ 下
			return;
		}

		// ├
		if (!left && right && top && bottom) {
			line(margin, 0, margin, size); // │ 左
			line(size - margin, 0, size - margin, margin); // │ 右
			line(size - margin, margin, size, margin); // ─ 上
			line(size - margin, size - margin, size, size - margin); // ─ 下
			line(size - margin, size - margin, size - margin, size); // │ 右
			return;
		}

		// ┤
		if (left && !right && top && bottom) {
			line(size - margin, 0, size - margin, size); // │ 右
			line(margin, 0, margin, margin); // │ 左
			line(0, margin, margin, margin); // ─ 上
			line(0, size - margin, margin, size - margin); // ─ 下
			line(margin, size - margin, margin, size); // │ 左
			return;
		}

		// ┬
		if (left && right && !top && bottom) {
			line(0, margin, size, margin); // ─ 上
			line(0, size - margin, margin, size - margin); // ─ 下
			line(margin, size - margin, margin, size); // │ 左
			line(size - margin, size - margin, size, size - margin); // ─ 下
			line(size - margin, size - margin, size - margin, size); // │ 右
			return;
		}

		// ┴
		if (left && right && top && !bottom) {
			line(0, size - margin, size, size - margin); // ─ 下
			line(margin, 0, margin, margin); // │ 左
			line(0, margin, margin, margin); // ─ 上
			line(size - margin, 0, size - margin, margin); // │ 右
			line(size - margin, margin, size, margin); // ─ 上
			return;
		}
	}

	const cellSize = mazeAreaSize / mazeSize;

	for (let x = 0; x < mazeSize; x++) {
		for (let y = 0; y < mazeSize; y++) {
			const actualX = margin + (cellSize * x);
			const actualY = margin + (cellSize * y);

			const cell = maze[x][y];

			const mark = (x === 0 && y === 0) || (x === mazeSize - 1 && y === mazeSize - 1);

			if (cell === 'left') drawCell(ctx, actualX, actualY, cellSize, true, false, false, false, mark);
			if (cell === 'right') drawCell(ctx, actualX, actualY, cellSize, false, true, false, false, mark);
			if (cell === 'top') drawCell(ctx, actualX, actualY, cellSize, false, false, true, false, mark);
			if (cell === 'bottom') drawCell(ctx, actualX, actualY, cellSize, false, false, false, true, mark);
			if (cell === 'leftTop') drawCell(ctx, actualX, actualY, cellSize, true, false, true, false, mark);
			if (cell === 'leftBottom') drawCell(ctx, actualX, actualY, cellSize, true, false, false, true, mark);
			if (cell === 'rightTop') drawCell(ctx, actualX, actualY, cellSize, false, true, true, false, mark);
			if (cell === 'rightBottom') drawCell(ctx, actualX, actualY, cellSize, false, true, false, true, mark);
			if (cell === 'leftRightTop') drawCell(ctx, actualX, actualY, cellSize, true, true, true, false, mark);
			if (cell === 'leftRightBottom') drawCell(ctx, actualX, actualY, cellSize, true, true, false, true, mark);
			if (cell === 'leftTopBottom') drawCell(ctx, actualX, actualY, cellSize, true, false, true, true, mark);
			if (cell === 'rightTopBottom') drawCell(ctx, actualX, actualY, cellSize, false, true, true, true, mark);
			if (cell === 'leftRight') drawCell(ctx, actualX, actualY, cellSize, true, true, false, false, mark);
			if (cell === 'topBottom') drawCell(ctx, actualX, actualY, cellSize, false, false, true, true, mark);
			if (cell === 'cross') drawCell(ctx, actualX, actualY, cellSize, true, true, true, true, mark);
		}
	}

	return canvas.toBuffer();
}
