import autobind from 'autobind-decorator';
import Module from '../../module';
import MessageLike from '../../message-like';

export default class FollowModule extends Module {
	public readonly name = 'follow';

	@autobind
	public install() {
		return {
			onMention: this.onMention
		};
	}

	@autobind
	private onMention(msg: MessageLike) {
		if (msg.text && msg.includes(['フォロー', 'フォロバ', 'follow me'])) {
			if (!msg.user.isFollowing) {
				this.ai.api('following/create', {
					userId: msg.userId,
				});
				return {
					reaction: msg.friend.love >= 0 ? 'like' : null
				};
			} else {
				return {
					reaction: msg.friend.love >= 0 ? 'hmm' : null
				};
			}
		} else {
			return false;
		}
	}
}
