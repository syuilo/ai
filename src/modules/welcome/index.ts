import 藍 from '../../ai';
import IModule from '../../module';

export default class WelcomeModule implements IModule {
	public name = 'welcome';

	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;
	}

	public onLocalNote = (note: any) => {
		if (note.isFirstNote) {
			setTimeout(() => {
				this.ai.api('notes/create', {
					renoteId: note.id
				});
			}, 3000);

			setTimeout(() => {
				this.ai.api('notes/reactions/create', {
					noteId: note.id,
					reaction: 'congrats'
				});
			}, 5000);
		}
	}
}
