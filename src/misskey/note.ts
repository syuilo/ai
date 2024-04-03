export type Note = {
	id: string;
	text: string | null;
	cw: string | null;
	userId: string;
	reply: any | null;
	poll?: {
		choices: {
			votes: number;
			text: string;
		}[];
		expiredAfter: number;
		multiple: boolean;
	} | null;
};
