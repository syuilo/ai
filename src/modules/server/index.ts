import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import 藍 from '../../ai';
import IModule from '../../module';
import serifs from '../../serifs';
import config from '../../config';
import MessageLike from '../../message-like';
const ReconnectingWebSocket = require('../../../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

export default class ServerModule implements IModule {
	private ai: 藍;
	private connection?: any;
	private preventScheduleReboot = false;
	private rebootTimer: NodeJS.Timer;
	private rebootTimerSub: NodeJS.Timer;
	private recentStat: any;

	/**
	 * 1秒後とのログ1分間分
	 */
	private statsLogs: any[] = [];

	public install = (ai: 藍) => {
		this.ai = ai;

		this.connection = new ReconnectingWebSocket(`${config.wsUrl}/server-stats`, [], {
			WebSocket: WebSocket
		});

		this.connection.addEventListener('open', () => {
			console.log('server-stats stream opened');
		});

		this.connection.addEventListener('close', () => {
			console.log('server-stats stream closed');
		});

		this.connection.addEventListener('message', message => {
			const msg = JSON.parse(message.data);

			this.onConnectionMessage(msg);
		});

		setInterval(() => {
			this.statsLogs.push(this.recentStat);
			if (this.statsLogs.length > 60) this.statsLogs.unshift();
		}, 1000);

		setInterval(() => {
			this.check();
		}, 1000);
	}

	private check = () => {
		const average = (arr) => arr.reduce((a, b) => a + b) / arr.length;

		const memPercentages = this.statsLogs.map(s => (s.mem.used / s.mem.total) * 100);
		const memPercentage = average(memPercentages);
		if (memPercentage >= 90) {
			this.scheduleReboot('mem');
		}

		const cpuPercentages = this.statsLogs.map(s => s.cpu_usage * 100);
		const cpuPercentage = average(cpuPercentages);
		if (cpuPercentage >= 70) {
			this.scheduleReboot('cpu');
		}
	}

	private onConnectionMessage = (msg: any) => {
		switch (msg.type) {

			case 'stats': {
				this.onStats(msg.body);
				break;
			}

			default:
				break;
		}
	}

	private onStats = async (stats: any) => {
		this.recentStat = stats;
	}

	private scheduleReboot = (reason: string) => {
		if (this.preventScheduleReboot) return;

		this.preventScheduleReboot = true;

		this.ai.post({
			text: reason == 'cpu' ? serifs.REBOOT_SCHEDULED_CPU : serifs.REBOOT_SCHEDULED_MEM
		});

		this.rebootTimer = setTimeout(() => {
			childProcess.exec('forever restartall');
		}, 1000 * 60);

		this.rebootTimerSub = setTimeout(() => {
			this.ai.post({
				cw: serifs.REBOOT,
				text: serifs.REBOOT_DETAIL
			});
		}, 1000 * 50);
	}

	public onMention = (msg: MessageLike) => {
		if (msg.text && msg.text.includes('再起動しないで')) {
			if (msg.user.isAdmin) {
				msg.reply(serifs.REBOOT_CANCEL_REQUESTED_ACCEPT);

				this.ai.post({
					text: serifs.REBOOT_CANCELED
				});

				clearTimeout(this.rebootTimer);
				clearTimeout(this.rebootTimerSub);

				setTimeout(() => {
					this.preventScheduleReboot = false;
				}, 1000 * 60 * 3);
			} else {
				msg.reply(serifs.REBOOT_CANCEL_REQUESTED_REJECT);
			}
			return true;
		} else {
			return false;
		}
	}
}
