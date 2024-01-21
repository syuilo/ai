import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import serifs from '@/serifs.js';
import Message from '@/message.js';
import { renderChart } from './render-chart.js';
import { items } from '@/vocabulary.js';
import config from '@/config.js';

export default class extends Module {
	public readonly name = 'chart';

	@bindThis
	public install() {
		if (config.chartEnabled === false) return {};

		this.post();
		setInterval(this.post, 1000 * 60 * 3);

		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
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

	@bindThis
	private async genChart(type, params?): Promise<any> {
		this.log('Chart data fetching...');

		let chart;

		if (type === 'userNotes') {
			const data = await this.ai.api('charts/user/notes', {
				span: 'day',
				limit: 30,
				userId: params.user.id
			});

			chart = {
				title: `@${params.user.username}さんの投稿数`,
				datasets: [{
					data: data.diffs.normal
				}, {
					data: data.diffs.reply
				}, {
					data: data.diffs.renote
				}]
			};
		} else if (type === 'followers') {
			const data = await this.ai.api('charts/user/following', {
				span: 'day',
				limit: 30,
				userId: params.user.id
			});

			chart = {
				title: `@${params.user.username}さんのフォロワー数`,
				datasets: [{
					data: data.local.followers.total
				}, {
					data: data.remote.followers.total
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
		} else {
			const suffixes = ['の売り上げ', 'の消費', 'の生産'];

			const limit = 30;
			const diffRange = 150;
			const datasetCount = 1 + Math.floor(Math.random() * 3);

			let datasets: any[] = [];

			for (let d = 0; d < datasetCount; d++) {
				let values = [Math.random() * 1000];

				for (let i = 1; i < limit; i++) {
					const prev = values[i - 1];
					values.push(prev + ((Math.random() * (diffRange * 2)) - diffRange));
				}

				datasets.push({
					data: values
				});
			}

			chart = {
				title: items[Math.floor(Math.random() * items.length)] + suffixes[Math.floor(Math.random() * suffixes.length)],
				datasets: datasets
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

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.includes(['チャート'])) {
			return false;
		} else {
			this.log('Chart requested');
		}

		let type = 'random';
		if (msg.includes(['フォロワー'])) type = 'followers';
		if (msg.includes(['投稿'])) type = 'userNotes';

		const file = await this.genChart(type, {
			user: msg.user
		});

		this.log('Replying...');
		msg.reply(serifs.chart.foryou, { file });

		return {
			reaction: 'like'
		};
	}
}
