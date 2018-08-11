import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import 藍 from '../../ai';
import IModule from '../../module';
import serifs from '../../serifs';
import config from '../../config';
const ReconnectingWebSocket = require('../../../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

export default class ServerModule implements IModule {
	private ai: 藍;
	private connection?: any;
	private rebootScheduled = false;
	private rebootTimer: any;
	private rebootTimerSub: any;

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
		const memUsage = Math.round((stats.mem.used / stats.mem.total) * 100);

		console.log(`[SERVER] MEM: ${memUsage}%`);

		if (memUsage >= 90) {
			this.scheduleReboot();
		}
	}

	private scheduleReboot = () => {
		if (this.rebootScheduled) return;

		this.rebootScheduled = true;

		this.ai.post({
			text: serifs.REBOOT_SCHEDULED
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
}
