import autobind from 'autobind-decorator';
import Module from '../../module';
import serifs from '../../serifs';
import { genItem } from '../../vocabulary';

export default class extends Module {
	public readonly name = 'noting';

	@autobind
	public install() {
		setInterval(() => {
			if (Math.random() < 0.05) {
				this.post();
			}
		}, 1000 * 60 * 10);

		return {};
	}

	@autobind
	private post() {
		const notes = [
			...serifs.noting.notes,
			() => {
				const item = genItem();
				return serifs.noting.want(item);
			},
			() => {
				const item = genItem();
				return serifs.noting.see(item);
			},
		];

		const note = notes[Math.floor(Math.random() * notes.length)];

		this.ai.post({
			text: typeof note === 'function' ? note() : note
		});
	}
}
