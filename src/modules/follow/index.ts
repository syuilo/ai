import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';

export default class FollowModule implements IModule {
	public readonly name = 'follow';
	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;
	}

	public onMention = (msg: MessageLike) => {
		if (msg.text && msg.includes(['フォロー', 'フォロバ', 'follow me'])) {
			if (!msg.user.isFollowing) {
				this.ai.api('following/create', {
					userId: msg.userId,
				});
				return {
					reaction: 'like'
				};
			} else {
				return {
					reaction: 'hmm'
				};
			}
		} else {
			return false;
		}
	}
}
