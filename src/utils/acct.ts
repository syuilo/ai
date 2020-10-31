export function acct(user: { username: string; host?: string | null; }): string {
	return user.host
		? `@${user.username}@${user.host}`
		: `@${user.username}`;
}
