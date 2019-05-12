import autobind from 'autobind-decorator';
import Module from '../../module';
import serifs from '../../serifs';
import Message from '../../message';
import { renderChart } from './render-chart';

export default class extends Module {
	public readonly name = 'chart';

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
		if (now.getHours() !== 23) return;
		const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
		const data = this.getData();
		if (data.lastPosted == date) return;
		data.lastPosted = date;
		this.setData(data);

		this.log('Time to chart');
		const file = await this.genChart('notes');

		this.log('Posting...');
		this.ai.post({
			text: serifs.chart.post,
			fileIds: [file.id]
		});
	}

	@autobind
	private async genChart(type, params?): Promise<any> {
		this.log('Chart data fetching...');

		let chart;

		if (type === 'userNotes') {
			const data = await this.ai.api('charts/user/notes', {
				span: 'day',
				limit: 30,
				userId: params.userId
			});

			chart = {
				datasets: [{
					data: data.diffs.normal
				}, {
					data: data.diffs.reply
				}, {
					data: data.diffs.renote
				}]
			};
		} else if (type === 'notes') {
			const data = await this.ai.api('charts/notes', {
				span: 'day',
				limit: 30,
			});

			chart = {
				datasets: [{
					data: data.local.diffs.normal
				}, {
					data: data.local.diffs.reply
				}, {
					data: data.local.diffs.renote
				}]
			};
		}

		this.log('Chart rendering...');
		const img = renderChart(chart);

		this.log('Image uploading...');
		const file = await this.ai.upload(img, {
			filename: 'chart.png',
			contentType: 'image/png'
		});

		return file;
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['チャート'])) {
			this.log('Chart requested');
			const file = await this.genChart('userNotes', {
				userId: msg.userId
			});
			this.log('Replying...');
			msg.replyWithFile(serifs.chart.foryou, file);
			return {
				reaction: 'like'
			};
		} else {
			return false;
		}
	}
}
