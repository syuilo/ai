import * as fs from 'fs';
import autobind from 'autobind-decorator';
import Module from '../../module';
import serifs from '../../serifs';
import * as tmp from 'tmp';
import { genMaze } from './gen-maze';
import { renderMaze } from './render-maze';

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
		if (now.getHours() !== 22) return;
		const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
		const data = this.getData();
		if (data.lastPosted == date) return;
		data.lastPosted = date;
		this.setData(data);

		const seed = date;

		this.log('Maze generating...');
		const maze = genMaze(seed);

		this.log('Maze rendering...');
		const [temp] = await this.createTemp();
		await renderMaze(seed, maze, fs.createWriteStream(temp));

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
}
