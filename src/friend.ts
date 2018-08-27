import 藍 from './ai';
import IModule from './module';

export type FriendDoc = {
	userId: string;
	user: any;
	name?: string;
	love?: number;
	lastLoveIncrementedAt?: string;
	todayLoveIncrements?: number;
	perModulesData?: any;
};

export default class Friend {
	private ai: 藍;

	public get userId() {
		return this.doc.userId;
	}

	public get name() {
		return this.doc.name;
	}

	public get love() {
		return this.doc.love || 0;
	}

	public doc: FriendDoc;

	constructor(ai: 藍, opts: { user?: any, doc?: FriendDoc }) {
		this.ai = ai;

		if (opts.user) {
			this.doc = this.ai.friends.findOne({
				userId: opts.user.id
			});

			if (this.doc == null) {
				this.doc = this.ai.friends.insertOne({
					userId: opts.user.id,
					user: opts.user
				});
			} else {
				this.doc.user = opts.user;
				this.save();
			}
		} else {
			this.doc = opts.doc;
		}
	}

	public updateUser = (user: any) => {
		this.doc.user = user;
		this.save();
	}

	public getPerModulesData = (module: IModule) => {
		if (this.doc.perModulesData == null) {
			this.doc.perModulesData = {};
			this.doc.perModulesData[module.name] = {};
			this.save();
		} else if (this.doc.perModulesData[module.name] == null) {
			this.doc.perModulesData[module.name] = {};
			this.save();
		}

		return this.doc.perModulesData[module.name];
	}

	public setPerModulesData = (module: IModule, data: any) => {
		if (this.doc.perModulesData == null) {
			this.doc.perModulesData = {};
		}

		this.doc.perModulesData[module.name] = data;

		this.save();
	}

	public incLove = () => {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		const today = `${y}/${m + 1}/${d}`;

		if (this.doc.lastLoveIncrementedAt != today) {
			this.doc.todayLoveIncrements = 0;
		}

		// 1日に上げられる親愛度は最大3
		if (this.doc.lastLoveIncrementedAt == today && this.doc.todayLoveIncrements >= 3) return;

		if (this.doc.love == null) this.doc.love = 0;
		this.doc.love++;
		this.doc.lastLoveIncrementedAt = today;
		this.doc.todayLoveIncrements = (this.doc.todayLoveIncrements || 0) + 1;
		this.save();
	}

	public updateName = (name: string) => {
		this.doc.name = name;
		this.save();
	}

	public save = () => {
		this.ai.friends.update(this.doc);
	}
}
