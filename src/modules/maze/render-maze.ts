import * as fs from 'fs';
import * as gen from 'random-seed';
const p = require('pureimage');

import { CellType } from './maze';
import { themes } from './themes';

const imageSize = 2048; // px
const margin = 192;
const mazeAreaSize = imageSize - (margin * 2);

export function renderMaze(seed, maze: CellType[][], stream: fs.WriteStream): Promise<void> {
	const rand = gen.create(seed);
	const mazeSize = maze.length;

	const colors = themes[rand(themes.length)];

	const canvas = p.make(imageSize, imageSize);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = colors.bg1;
	ctx.beginPath();
	ctx.fillRect(0, 0, imageSize, imageSize);

	ctx.fillStyle = colors.bg2;
	ctx.beginPath();
	ctx.fillRect(margin / 2, margin / 2, imageSize - ((margin / 2) * 2), imageSize - ((margin / 2) * 2));

	// Draw
	function drawCell(ctx, x, y, size, left, right, top, bottom, mark) {
		const wallThickness = size / 8;
		const wallMargin = size / 4;
		const markerMargin = size / 3;

		ctx.fillStyle = colors.road;
		if (left) {
			ctx.beginPath();
			ctx.fillRect(x, y + wallMargin, size - wallMargin, size - (wallMargin * 2));
		}
		if (right) {
			ctx.beginPath();
			ctx.fillRect(x + wallMargin, y + wallMargin, size - wallMargin, size - (wallMargin * 2));
		}
		if (top) {
			ctx.beginPath();
			ctx.fillRect(x + wallMargin, y, size - (wallMargin * 2), size - wallMargin);
		}
		if (bottom) {
			ctx.beginPath();
			ctx.fillRect(x + wallMargin, y + wallMargin, size - (wallMargin * 2), size - wallMargin);
		}

		if (mark) {
			ctx.fillStyle = colors.marker;
			ctx.beginPath();
			ctx.fillRect(x + markerMargin, y + markerMargin, size - (markerMargin * 2), size - (markerMargin * 2));
		}

		const wallLeftTopX = x + wallMargin - (wallThickness / 2);
		const wallLeftTopY = y + wallMargin - (wallThickness / 2);
		const wallRightTopX = x + size - wallMargin - (wallThickness / 2);
		const wallRightTopY = y + wallMargin - (wallThickness / 2);
		const wallLeftBottomX = x + wallMargin - (wallThickness / 2);
		const wallLeftBottomY = y + size - wallMargin - (wallThickness / 2);
		const wallRightBottomX = x + size - wallMargin - (wallThickness / 2);
		const wallRightBottomY = y + size - wallMargin - (wallThickness / 2);

		ctx.fillStyle = colors.wall;
		if (left && right && top && bottom) {
			ctx.beginPath();
			if (rand(2) === 0) {
				ctx.fillRect(x + wallMargin - (wallThickness / 2), y, wallThickness, size);
				ctx.fillRect(x + size - wallMargin - (wallThickness / 2), y, wallThickness, size);
				ctx.fillRect(x, y + wallMargin - (wallThickness / 2), wallMargin, wallThickness);
				ctx.fillRect(x + size - wallMargin, y + wallMargin - (wallThickness / 2), wallMargin, wallThickness);
				ctx.fillRect(x, y + size - wallMargin - (wallThickness / 2), wallMargin, wallThickness);
				ctx.fillRect(x + size - wallMargin, y + size - wallMargin - (wallThickness / 2), wallMargin, wallThickness);
			} else {
				ctx.fillRect(x, y + wallMargin - (wallThickness / 2), size, wallThickness);
				ctx.fillRect(x, y + size - wallMargin - (wallThickness / 2), size, wallThickness);
				ctx.fillRect(wallLeftTopX, y, wallThickness, wallMargin - (wallThickness / 2));
				ctx.fillRect(wallRightTopX, y, wallThickness, wallMargin - (wallThickness / 2));
				ctx.fillRect(wallLeftTopX, wallLeftBottomY, wallThickness, wallMargin + (wallThickness / 2));
				ctx.fillRect(wallRightTopX, wallRightBottomY, wallThickness, wallMargin + (wallThickness / 2));
			}
			return;
		}

		if (!left && right && !top && bottom) {
			ctx.beginPath();
			ctx.fillRect(wallLeftTopX, wallLeftTopY, size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallLeftTopX, wallLeftTopY, wallThickness, size - wallMargin + (wallThickness / 2));
		}

		if (right && bottom) {
			ctx.fillRect(wallRightBottomX, wallRightBottomY, wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallRightBottomX, wallRightBottomY, wallThickness, wallMargin + (wallThickness / 2));
		}

		if (left && !right && !top && bottom) {
			ctx.beginPath();
			ctx.fillRect(x, y + wallMargin - (wallThickness / 2), size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallRightTopX, y + wallMargin - (wallThickness / 2), wallThickness, size - wallMargin + (wallThickness / 2));
		}

		if (left && bottom) {
			ctx.fillRect(x, wallLeftBottomY, wallMargin - (wallThickness / 2), wallThickness);
			ctx.fillRect(wallLeftBottomX, wallLeftBottomY, wallThickness, wallMargin + (wallThickness / 2));
		}

		if (!left && right && top && !bottom) {
			ctx.beginPath();
			ctx.fillRect(wallLeftBottomX, y, wallThickness, size - wallMargin + (wallThickness / 2));
			ctx.fillRect(wallLeftBottomX, wallLeftBottomY, size - wallMargin + (wallThickness / 2), wallThickness);
		}

		if (right && top) {
			ctx.fillRect(wallRightTopX, y, wallThickness, wallMargin - (wallThickness / 2));
			ctx.fillRect(wallRightTopX, wallRightTopY, size - wallMargin - (wallThickness * 2), wallThickness);
		}

		if (left && !right && top && !bottom) {
			ctx.beginPath();
			ctx.fillRect(x, wallLeftBottomY, size - wallMargin - (wallThickness / 2), wallThickness);
			ctx.fillRect(wallRightTopX, y, wallThickness, size - wallMargin + (wallThickness / 2));
		}

		if (left && top) {
			ctx.fillRect(wallLeftTopX, y, wallThickness, wallMargin + (wallThickness / 2));
			ctx.fillRect(x, wallLeftTopY, wallMargin - (wallThickness / 2), wallThickness);
		}

		if (!left && right && !top && !bottom) {
			ctx.beginPath();
			ctx.fillRect(wallLeftTopX, wallLeftTopY, size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallLeftBottomX, wallLeftBottomY, size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallLeftTopX, wallLeftTopY, wallThickness, size - wallMargin - (wallThickness * 2));
			return;
		}

		if (left && !right && !top && !bottom) {
			ctx.beginPath();
			ctx.fillRect(x, wallLeftTopY, size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(x, wallLeftBottomY, size - wallMargin + (wallThickness / 2), wallThickness);
			ctx.fillRect(wallRightTopX, wallRightTopY, wallThickness, size - wallMargin - (wallThickness * 2));
			return;
		}

		if (!left && !right && !top && bottom) {
			ctx.beginPath();
			ctx.fillRect(wallLeftTopX, wallLeftTopY, wallThickness, size - wallMargin + (wallThickness / 2));
			ctx.fillRect(wallRightTopX, wallRightTopY, wallThickness, size - wallMargin + (wallThickness / 2));
			ctx.fillRect(wallLeftTopX, wallLeftTopY, size - wallMargin - (wallThickness * 2), wallThickness);
			return;
		}

		if (!left && !right && top && !bottom) {
			ctx.beginPath();
			ctx.fillRect(wallLeftTopX, y, wallThickness, size - wallMargin + (wallThickness / 2));
			ctx.fillRect(wallRightTopX, y, wallThickness, size - wallMargin + (wallThickness / 2));
			ctx.fillRect(wallLeftBottomX, wallLeftBottomY, size - wallMargin - (wallThickness * 2), wallThickness);
			return;
		}

		if (top && bottom) {
			if (!left) {
				ctx.beginPath();
				ctx.fillRect(x + wallMargin - (wallThickness / 2), y, wallThickness, size);
			}
			if (!right) {
				ctx.beginPath();
				ctx.fillRect(x + size - wallMargin - (wallThickness / 2), y, wallThickness, size);
			}
		}
		if (left && right) {
			if (!top) {
				ctx.beginPath();
				ctx.fillRect(x, y + wallMargin - (wallThickness / 2), size, wallThickness);
			}
			if (!bottom) {
				ctx.beginPath();
				ctx.fillRect(x, y + size - wallMargin - (wallThickness / 2), size, wallThickness);
			}
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

	return p.encodePNGToStream(canvas, stream);
}
