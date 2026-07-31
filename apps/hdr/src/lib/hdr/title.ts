/**
 * Split a verdict title into display lines at the first sentence boundary.
 *
 * Pure on purpose (no DOM) — verdict titles are short enough that "first
 * sentence, then the rest" is all the wrapping logic the headline needs.
 */
export function splitTitle(title: string): string[] {
	const i = title.indexOf('. ');
	if (i === -1) return [title];
	return [title.slice(0, i + 1), title.slice(i + 2)];
}
