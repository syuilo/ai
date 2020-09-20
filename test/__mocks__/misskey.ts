import * as http from 'http';
import * as Koa from 'koa';
import * as websocket from 'websocket';

export class Misskey {
	private server: http.Server;
	private streaming: websocket.connection;

	constructor() {
		const app = new Koa();

		this.server = http.createServer(app.callback());

		const ws = new websocket.server({
			httpServer: this.server
		});

		ws.on('request', async (request) => {
			const q = request.resourceURL.query as ParsedUrlQuery;
	
			this.streaming = request.accept();
		});

		this.server.listen(3000);
	}

	public waitForStreamingMessage(handler) {
		return new Promise((resolve, reject) => {
			const onMessage = (data: websocket.IMessage) => {
				if (data.utf8Data == null) return;
				const message = JSON.parse(data.utf8Data);
				const result = handler(message);
				if (result) {
					this.streaming.off('message', onMessage);
					resolve();
				}
			};
			this.streaming.on('message', onMessage);
		});
	}

	public async waitForMainChannelConnected() {
		await this.waitForStreamingMessage(message => {
			const { type, body } = message;
			if (type === 'connect') {
				const { channel, id, params, pong } = body;

				if (channel !== 'main') return;

				if (pong) {
					this.sendStreamingMessage('connected', {
						id: id
					});
				}

				return true;
			}
		});
	}

	public sendStreamingMessage(type: string, payload: any) {
		this.streaming.send(JSON.stringify({
			type: type,
			body: payload
		}));
	}
}
