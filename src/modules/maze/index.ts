/**
 * Random avatar generator
 */

const p = require('pureimage');
import * as gen from 'random-seed';
import * as fs from 'fs';
import autobind from 'autobind-decorator';
import Module from '../../module';
import serifs from '../../serifs';
import * as tmp from 'tmp';

type CellType = 'empty' | 'left' | 'right' | 'top' | 'bottom' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | 'leftRightTop' | 'leftRightBottom' | 'leftTopBottom' | 'rightTopBottom' | 'leftRight' | 'topBottom' | 'cross';

type Dir = 'left' | 'right' | 'top' | 'bottom';

const cellVariants = {
	empty: {
		digg: { left: 'left', right: 'right', top: 'top', bottom: 'bottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	left: {
		digg: { left: null, right: 'leftRight', top: 'leftTop', bottom: 'leftBottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	right: {
		digg: { left: 'leftRight', right: null, top: 'rightTop', bottom: 'rightBottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	top: {
		digg: { left: 'leftTop', right: 'rightTop', top: null, bottom: 'topBottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	bottom: {
		digg: { left: 'leftBottom', right: 'rightBottom', top: 'topBottom', bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftTop: {
		digg: { left: null, right: 'leftRightTop', top: null, bottom: 'leftTopBottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftBottom: {
		digg: { left: null, right: 'leftRightBottom', top: 'leftTopBottom', bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	rightTop: {
		digg: { left: 'leftRightTop', right: null, top: null, bottom: 'rightTopBottom' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	rightBottom: {
		digg: { left: 'leftRightBottom', right: null, top: 'rightTopBottom', bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftRightTop: {
		digg: { left: null, right: null, top: null, bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftRightBottom: {
		digg: { left: null, right: null, top: null, bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftTopBottom: {
		digg: { left: null, right: null, top: null, bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	rightTopBottom: {
		digg: { left: null, right: null, top: null, bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
	leftRight: {
		digg: { left: null, right: null, top: 'leftRightTop', bottom: 'leftRightBottom' },
		cross: { left: false, right: false, top: true, bottom: true },
	},
	topBottom: {
		digg: { left: 'leftTopBottom', right: 'rightTopBottom', top: null, bottom: null },
		cross: { left: true, right: true, top: false, bottom: false },
	},
	cross: {
		digg: { left: 'cross', right: 'cross', top: 'cross', bottom: 'cross' },
		cross: { left: false, right: false, top: false, bottom: false },
	},
} as { [k in CellType]: {
	digg: { left: CellType | null; right: CellType | null; top: CellType | null; bottom: CellType | null; };
	cross: { left: boolean; right: boolean; top: boolean; bottom: boolean; };
} };

const imageSize = 2048; // px
const margin = 256;
const mazeAreaSize = imageSize - (margin * 2);

const themes = [{
	bg1: '#C1D9CE',
	bg2: '#F2EDD5',
	wall: '#0F8AA6',
	road: '#C1D9CE',
	marker: '#84BFBF',
}, {
	bg1: '#17275B',
	bg2: '#1F2E67',
	wall: '#17275B',
	road: '#6A77A4',
	marker: '#E6E5E3',
}, {
	bg1: '#BFD962',
	bg2: '#EAF2AC',
	wall: '#1E4006',
	road: '#BFD962',
	marker: '#74A608',
}, {
	bg1: '#C0CCB8',
	bg2: '#FFE2C0',
	wall: '#664A3C',
	road: '#FFCB99',
	marker: '#E78F72',
}, {
	bg1: '#101010',
	bg2: '#151515',
	wall: '#909090',
	road: '#202020',
	marker: '#606060',
}, {
	bg1: '#e0e0e0',
	bg2: '#f2f2f2',
	wall: '#a0a0a0',
	road: '#e0e0e0',
	marker: '#707070',
}, {
	bg1: '#7DE395',
	bg2: '#D0F3CF',
	wall: '#349D9E',
	road: '#7DE395',
	marker: '#56C495',
}, {
	bg1: '#C9EEEA',
	bg2: '#DBF4F1',
	wall: '#4BC6B9',
	road: '#C9EEEA',
	marker: '#19A89D',
}, {
	bg1: '#1e231b',
	bg2: '#27331e',
	wall: '#67b231',
	road: '#385622',
	marker: '#78d337',
}];

export default class extends Module {
	public readonly name = 'maze';

	@autobind
	public install() {
		this.post();
		setInterval(this.post, 1000 * 60 * 3);

		return {};
	}

	@autobind
	private async post() {
		const now = new Date();
		if (now.getHours() !== 11) return;
		const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
		const data = this.getData();
		if (data.lastPosted == date) return;
		data.lastPosted = date;
		this.setData(data);

		const seed = date;

		this.log('Maze generating...');
		const maze = this.genMize(seed);

		this.log('Maze rendering...');
		const [temp] = await this.createTemp();
		await this.renderMaze(seed, maze, fs.createWriteStream(temp));

		this.log('Image uploading...');
		const file = await this.ai.upload(fs.createReadStream(temp));

		this.log('Posting...');
		this.ai.post({
			text: serifs.maze.post,
			fileIds: [file.id]
		});
	}

	@autobind
	private createTemp(): Promise<[string, any]> {
		return new Promise<[string, any]>((res, rej) => {
			tmp.file((e, path, fd, cleanup) => {
				if (e) return rej(e);
				res([path, cleanup]);
			});
		});
	}

	@autobind
	private genMize(seed) {
		const rand = gen.create(seed);

		const mazeSize = 10 + rand(21);

		// maze (filled by 'empty')
		const maze: CellType[][] = new Array(mazeSize);
		for (let i = 0; i < mazeSize; i++) {
			maze[i] = new Array(mazeSize).fill('empty');
		}

		const origin = {
			x: rand(mazeSize),
			y: rand(mazeSize),
		};

		function checkDiggable(x: number, y: number, dir: Dir) {
			if (cellVariants[maze[x][y]].digg[dir] === null) return false;

			const newPos =
				dir === 'top'    ? { x: x, y: y - 1 } :
				dir === 'bottom' ? { x: x, y: y + 1 } :
				dir === 'left'   ? { x: x - 1, y: y } :
				dir === 'right'  ? { x: x + 1, y: y } :
				{ x, y };

			if (newPos.x < 0 || newPos.y < 0 || newPos.x >= mazeSize || newPos.y >= mazeSize) return false;

			const cell = maze[newPos.x][newPos.y];
			if (cell === 'empty') return true;
			if (cellVariants[cell].cross[dir] && checkDiggable(newPos.x, newPos.y, dir)) return true;

			return false;
		}

		function diggFrom(x: number, y: number) {
			const isUpDiggable    = checkDiggable(x, y, 'top');
			const isRightDiggable = checkDiggable(x, y, 'right');
			const isDownDiggable  = checkDiggable(x, y, 'bottom');
			const isLeftDiggable  = checkDiggable(x, y, 'left');

			if (!isUpDiggable && !isRightDiggable && !isDownDiggable && !isLeftDiggable) return;

			const dirs: Dir[] = [];
			if (isUpDiggable) dirs.push('top');
			if (isRightDiggable) dirs.push('right');
			if (isDownDiggable) dirs.push('bottom');
			if (isLeftDiggable) dirs.push('left');

			const dir = dirs[rand(dirs.length)];

			maze[x][y] = cellVariants[maze[x][y]].digg[dir];

			if (dir === 'top') {
				maze[x][y - 1] = maze[x][y - 1] === 'empty' ? 'bottom' : 'cross';
				diggFrom(x, y - 1);
				return;
			}
			if (dir === 'right') {
				maze[x + 1][y] = maze[x + 1][y] === 'empty' ? 'left' : 'cross';
				diggFrom(x + 1, y);
				return;
			}
			if (dir === 'bottom') {
				maze[x][y + 1] = maze[x][y + 1] === 'empty' ? 'top' : 'cross';
				diggFrom(x, y + 1);
				return;
			}
			if (dir === 'left') {
				maze[x - 1][y] = maze[x - 1][y] === 'empty' ? 'right' : 'cross';
				diggFrom(x - 1, y);
				return;
			}
		}

		diggFrom(origin.x, origin.y);

		let hasEmptyCell = true;
		while (hasEmptyCell) {
			const nonEmptyCells = [];

			for (let y = 0; y < mazeSize; y++) {
				for (let x = 0; x < mazeSize; x++) {
					const cell = maze[x][y];
					if (cell !== 'empty' && cell !== 'cross') nonEmptyCells.push([x, y]);
				}
			}

			const pos = nonEmptyCells[rand(nonEmptyCells.length)];

			diggFrom(pos[0], pos[1]);

			hasEmptyCell = false;
			for (let y = 0; y < mazeSize; y++) {
				for (let x = 0; x < mazeSize; x++) {
					if (maze[x][y] === 'empty') hasEmptyCell = true;
				}
			}
		}

		return maze;
	}

	@autobind
	private renderMaze(seed, maze: CellType[][], stream: fs.WriteStream): Promise<void> {
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
}
