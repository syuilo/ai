import * as websocket from 'websocket';

export class StreamingApi {
	private ws: WS;

	constructor() {
		this.ws = new WS('ws://localhost/streaming');
	}

	public async waitForMainChannelConnected() {
		await expect(this.ws).toReceiveMessage("hello");
	}

	public send(message) {
		this.ws.send(JSON.stringify(message));
	}
}
