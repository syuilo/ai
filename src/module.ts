import 藍 from './ai';
import MessageLike from './message-like';

export default interface IModule {
	install?: (ai: 藍) => void;
	onMention?: (msg: MessageLike) => boolean;
}
