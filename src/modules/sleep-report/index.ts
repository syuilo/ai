import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import serifs from '@/serifs.js';

export default class extends Module {
	public readonly name = 'sleepReport';

	@bindThis
	public install() {
		this.report();

		return {};
	}

	@bindThis
	private report() {
		const now = Date.now();

		const sleepTime = now - this.ai.lastSleepedAt;

		const sleepHours = sleepTime / 1000 / 60 / 60;

		if (sleepHours < 0.1) return;

		if (sleepHours >= 1) {
			this.ai.post({
				text: serifs.sleepReport.report(Math.round(sleepHours))
			});
		} else {
			this.ai.post({
				text: serifs.sleepReport.reportUtatane
			});
		}
	}
}
