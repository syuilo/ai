export default function (): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();
	const today = `${y}/${m + 1}/${d}`;
	return today;
}
