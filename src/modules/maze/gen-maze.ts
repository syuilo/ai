import gen from 'random-seed';
import { CellType } from './maze.js';

const cellVariants = {
	void: {
		digg: { left: null, right: null, top: null, bottom: null },
		cross: { left: false, right: false, top: false, bottom: false },
	},
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

type Dir = 'left' | 'right' | 'top' | 'bottom';

export function genMaze(seed, complexity?) {
	const rand = gen.create(seed);

	let mazeSize;
	if (complexity) {
		if (complexity === 'veryEasy') mazeSize = 3 + rand(3);
		if (complexity === 'easy') mazeSize = 8 + rand(8);
		if (complexity === 'hard') mazeSize = 22 + rand(13);
		if (complexity === 'veryHard') mazeSize = 40 + rand(20);
		if (complexity === 'ai') mazeSize = 100;
	} else {
		mazeSize = 11 + rand(21);
	}

	const donut = rand(3) === 0;
	const donutWidth = 1 + Math.floor(mazeSize / 8) + rand(Math.floor(mazeSize / 4));

	const straightMode = rand(3) === 0;
	const straightness = 5 + rand(10);

	// maze (filled by 'empty')
	const maze: CellType[][] = new Array(mazeSize);
	for (let i = 0; i < mazeSize; i++) {
		maze[i] = new Array(mazeSize).fill('empty');
	}

	if (donut) {
		for (let y = 0; y < mazeSize; y++) {
			for (let x = 0; x < mazeSize; x++) {
				if (x > donutWidth && x < (mazeSize - 1) - donutWidth && y > donutWidth && y < (mazeSize - 1) - donutWidth) {
					maze[x][y] = 'void';
				}
			}
		}
	}

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
		if (cell === 'void') return false;
		if (cell === 'empty') return true;
		if (cellVariants[cell].cross[dir] && checkDiggable(newPos.x, newPos.y, dir)) return true;

		return false;
	}

	function diggFrom(x: number, y: number, prevDir?: Dir) {
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

		let dir: Dir;
		if (straightMode && rand(straightness) !== 0) {
			if (prevDir != null && dirs.includes(prevDir)) {
				dir = prevDir;
			} else {
				dir = dirs[rand(dirs.length)];
			}
		} else {
			dir = dirs[rand(dirs.length)];
		}

		maze[x][y] = cellVariants[maze[x][y]].digg[dir]!;

		if (dir === 'top') {
			maze[x][y - 1] = maze[x][y - 1] === 'empty' ? 'bottom' : 'cross';
			diggFrom(x, y - 1, dir);
			return;
		}
		if (dir === 'right') {
			maze[x + 1][y] = maze[x + 1][y] === 'empty' ? 'left' : 'cross';
			diggFrom(x + 1, y, dir);
			return;
		}
		if (dir === 'bottom') {
			maze[x][y + 1] = maze[x][y + 1] === 'empty' ? 'top' : 'cross';
			diggFrom(x, y + 1, dir);
			return;
		}
		if (dir === 'left') {
			maze[x - 1][y] = maze[x - 1][y] === 'empty' ? 'right' : 'cross';
			diggFrom(x - 1, y, dir);
			return;
		}
	}

	//#region start digg
	const nonVoidCells: [number, number][] = [];

	for (let y = 0; y < mazeSize; y++) {
		for (let x = 0; x < mazeSize; x++) {
			const cell = maze[x][y];
			if (cell !== 'void') nonVoidCells.push([x, y]);
		}
	}

	const origin = nonVoidCells[rand(nonVoidCells.length)];

	diggFrom(origin[0], origin[1]);
	//#endregion

	let hasEmptyCell = true;
	while (hasEmptyCell) {
		const nonEmptyCells: [number, number][] = [];

		for (let y = 0; y < mazeSize; y++) {
			for (let x = 0; x < mazeSize; x++) {
				const cell = maze[x][y];
				if (cell !== 'empty' && cell !== 'void' && cell !== 'cross') nonEmptyCells.push([x, y]);
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
