import 藍 from './ai';
import MessageLike from './message-like';

export default interface IModule {
	name: string;
	install?: (ai: 藍) => void;
	onMention?: (msg: MessageLike) => boolean | Result;
	onReplyThisModule?: (msg: MessageLike, data?: any) => void | Result;
}

export type Result = {
	reaction: string;
};
