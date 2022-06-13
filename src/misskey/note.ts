export type Note = {
	id: string;
	createdAt: Date;
	userId: string;
	user: {
		id: string;
	},
	text: string | null;
	cw: string | null;
	visibility: "public" | "home" | "followers" | "specified";
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
