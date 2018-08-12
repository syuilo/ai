import 藍 from './ai';
import MessageLike from './message-like';

export default interface IModule {
	name: string;
	install?: (ai: 藍) => void;
	onMention?: (msg: MessageLike) => boolean;
	onReplyThisModule?: (msg: MessageLike) => void;
}
