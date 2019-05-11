import * as fs from 'fs';
import autobind from 'autobind-decorator';
import Module from '../../module';
import serifs from '../../serifs';
import * as tmp from 'tmp';
import { genMaze } from './gen-maze';
import { renderMaze } from './render-maze';
import Message from '../../message';

export default class extends Module {
	public readonly name = 'maze';

	@autobind
	public install() {
		this.post();
		setInterval(this.post, 1000 * 60 * 3);

		return {
			mentionHook: this.mentionHook
		};
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

		this.log('Time to maze');
		const file = await this.genMazeFile(date);

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
	private async genMazeFile(seed): Promise<any> {
		this.log('Maze generating...');
		const maze = genMaze(seed);

		this.log('Maze rendering...');
		const [temp] = await this.createTemp();
		await renderMaze(seed, maze, fs.createWriteStream(temp));

		this.log('Image uploading...');
		const file = await this.ai.upload(fs.createReadStream(temp));

		return file;
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['迷路'])) {
			this.log('Maze requested');
			setTimeout(async () => {
				const file = await this.genMazeFile(Date.now());
				this.log('Replying...');
				msg.replyWithFile(serifs.maze.foryou, file);
			}, 3000);
			return {
				reaction: 'like'
			};
		} else {
			return false;
		}
	}
}
