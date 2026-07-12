/**
 * Click-to-edit runtime for the portfolio.
 *
 * Activated ONLY when the URL carries `?edit=1&studioOrigin=<http(s) origin>`
 * (see `parseEditParams`). Dynamically imported from `+layout.svelte`, so the
 * normal site and the prerendered build never bundle any of this.
 *
 * Responsibilities:
 *  - Parse + validate the activation params.
 *  - Define the postMessage protocol types exchanged with the studio parent.
 *  - `createEditSession()` wires the DOM: hover outlines (via injected stylesheet),
 *    inline contenteditable text editing (mirrors the studio InlineTextEditor),
 *    tag-list editing with an injected "+" chip, link URL editing (delegated to
 *    the overlay popover), the ready/init handshake, and full teardown.
 *
 * See design-refs/EDIT-CONTRACT.md for the authoritative spec.
 */
import { tick } from "svelte";
import { c, cList, applyLocal } from "./index.js";

/* ----------------------------------------------------------------------------
 * postMessage protocol
 * ------------------------------------------------------------------------- */

/** child → parent: sent once the runtime is wired up. */
export interface PortfolioEditReadyMsg {
	type: "portfolio:edit-ready";
}
/** child → parent: sent on every committed edit. */
export interface PortfolioContentEditMsg {
	type: "portfolio:content-edit";
	key: string;
	value: string | string[];
}
export type PortfolioMessage = PortfolioEditReadyMsg | PortfolioContentEditMsg;

/** parent → child: acknowledges the handshake. */
export interface StudioEditInitMsg {
	type: "studio:edit-init";
}
export type StudioMessage = StudioEditInitMsg;

/* ----------------------------------------------------------------------------
 * Activation
 * ------------------------------------------------------------------------- */

export interface EditParams {
	studioOrigin: string;
}

/**
 * Returns the (normalised) studio origin when the URL requests edit mode with a
 * valid http(s) origin, else null. Never throws.
 */
export function parseEditParams(url: URL): EditParams | null {
	if (url.searchParams.get("edit") !== "1") return null;
	const rawOrigin = url.searchParams.get("studioOrigin");
	if (!rawOrigin) return null;
	try {
		const u = new URL(rawOrigin);
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		return { studioOrigin: u.origin };
	} catch {
		return null;
	}
}

/* ----------------------------------------------------------------------------
 * Session
 * ------------------------------------------------------------------------- */

export interface LinkEditRequest {
	/** null when only the URL is editable. */
	labelKey: string | null;
	urlKey: string;
	label: string;
	url: string;
	rect: DOMRect;
}

export interface LinkEditCommit {
	labelKey: string | null;
	urlKey: string;
	label: string;
	url: string;
}

export interface CreateEditSessionOptions {
	studioOrigin: string;
	/** Called when a `[data-edit-href]` link is clicked; the overlay shows a popover. */
	requestLinkEdit: (req: LinkEditRequest) => void;
}

export interface EditSession {
	/** applyLocal + post a committed edit. */
	commit: (key: string, value: string | string[]) => void;
	/** commit both label (if present) and URL of a link, from the popover. */
	commitLink: (data: LinkEditCommit) => void;
	destroy: () => void;
}

const STYLE_ID = "content-edit-styles";
const ACTIVE_CLASS = "content-edit-active";
const EDITING_CLASS = "content-edit-editing";
const ADD_CHIP_SELECTOR = "[data-edit-add-chip]";

interface ActiveEdit {
	el: HTMLElement;
	commit: () => void;
	cancel: () => void;
}

// Cached across the whole module: `contenteditable="plaintext-only"` isn't
// supported by every browser (e.g. Firefox < 136), and probing it is cheap
// but pointless to repeat on every edit.
let plaintextOnlySupportedCache: boolean | null = null;
function plaintextOnlySupported(): boolean {
	if (plaintextOnlySupportedCache === null) {
		const probe = document.createElement("div");
		probe.contentEditable = "plaintext-only";
		plaintextOnlySupportedCache = probe.contentEditable === "plaintext-only";
	}
	return plaintextOnlySupportedCache;
}

export function createEditSession(opts: CreateEditSessionOptions): EditSession {
	const { studioOrigin, requestLinkEdit } = opts;
	let activeEdit: ActiveEdit | null = null;

	/* --- messaging --- */

	function post(msg: PortfolioMessage): void {
		window.parent?.postMessage(msg, studioOrigin);
	}

	function commit(key: string, value: string | string[]): void {
		applyLocal(key, value);
		post({ type: "portfolio:content-edit", key, value });
	}

	function commitLink(data: LinkEditCommit): void {
		if (data.labelKey) commit(data.labelKey, data.label);
		commit(data.urlKey, data.url);
	}

	function onMessage(event: MessageEvent): void {
		if (event.origin !== studioOrigin) return;
		if (event.source !== window.parent) return;
		const data = event.data as StudioMessage | undefined;
		if (data?.type === "studio:edit-init") {
			// Handshake acknowledged: stop retrying "ready". Idempotent — further
			// (redundant) inits from the parent are simply ignored, which is what
			// keeps this exchange from ping-ponging forever.
			if (acked) return;
			acked = true;
			stopReadyRetry();
		}
	}

	/* --- ready/init handshake (bounded retry, terminates on first ack) --- */

	// The parent's message listener may not be registered yet when we post our
	// first "ready" (e.g. right after HMR). Retry on a short interval until the
	// parent acks with "studio:edit-init", then stop for good. This must never
	// turn into an unconditional reply-to-reply loop with the parent: only the
	// child re-sends (on a timer, gated by `acked`), and the parent must reply
	// to "ready" at most once per connection (see +page.svelte handleMessage).
	let acked = false;
	let readyRetryTimer: ReturnType<typeof setInterval> | null = null;
	let readyRetryCount = 0;
	const READY_RETRY_INTERVAL_MS = 500;
	const READY_RETRY_MAX_ATTEMPTS = 20; // ~10s, then give up quietly

	function startReadyRetry(): void {
		post({ type: "portfolio:edit-ready" });
		readyRetryTimer = setInterval(() => {
			if (acked || ++readyRetryCount >= READY_RETRY_MAX_ATTEMPTS) {
				stopReadyRetry();
				return;
			}
			post({ type: "portfolio:edit-ready" });
		}, READY_RETRY_INTERVAL_MS);
	}

	function stopReadyRetry(): void {
		if (readyRetryTimer !== null) {
			clearInterval(readyRetryTimer);
			readyRetryTimer = null;
		}
	}

	/* --- contenteditable mode (with a Firefox < 136 fallback) --- */

	function makeEditable(el: HTMLElement): void {
		el.setAttribute("contenteditable", plaintextOnlySupported() ? "plaintext-only" : "true");
	}

	/* --- selection helpers --- */

	function placeCursorAtEnd(el: HTMLElement): void {
		const range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	}

	function handlePlainPaste(event: ClipboardEvent, el: HTMLElement): void {
		event.preventDefault();
		const text = event.clipboardData?.getData("text/plain") ?? "";
		if (!text) return;
		const sel = window.getSelection();
		if (!sel) return;
		let range: Range;
		if (sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
			range = sel.getRangeAt(0);
		} else {
			range = document.createRange();
			range.selectNodeContents(el);
			range.collapse(false);
		}
		range.deleteContents();
		const node = document.createTextNode(text);
		range.insertNode(node);
		range.setStartAfter(node);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}

	function finishActive(): void {
		if (activeEdit) activeEdit.commit();
	}

	/* --- inline text editing ([data-edit]) --- */

	function beginTextEdit(el: HTMLElement): void {
		const key = el.getAttribute("data-edit");
		if (!key) return;
		const original = el.textContent ?? "";
		let done = false;

		el.classList.add(EDITING_CLASS);
		makeEditable(el);
		el.focus();
		placeCursorAtEnd(el);

		function cleanup(): void {
			el.removeEventListener("keydown", onKey);
			el.removeEventListener("blur", onBlur);
			el.removeEventListener("paste", onPaste);
			el.removeAttribute("contenteditable");
			el.classList.remove(EDITING_CLASS);
			activeEdit = null;
		}
		function commitEdit(): void {
			if (done) return;
			done = true;
			// Normalise away any newline that snuck in (e.g. a fallback
			// contenteditable="true" region allowing a soft line break before the
			// keydown handler below intercepts it) — these fields are single-line
			// content strings, never multi-line.
			const text = (el.textContent ?? "").replace(/\r?\n/g, " ");
			cleanup();
			if (text !== original) commit(key!, text);
			else el.textContent = original;
		}
		function cancelEdit(): void {
			if (done) return;
			done = true;
			cleanup();
			el.textContent = original;
		}
		function onKey(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				cancelEdit();
			} else if (event.key === "Enter") {
				// Commit on Enter everywhere (not just headings): every [data-edit]
				// field is a single-line content string, so a literal newline must
				// never reach commitEdit/the stored JSON.
				event.preventDefault();
				commitEdit();
			}
		}
		function onBlur(): void {
			commitEdit();
		}
		function onPaste(event: ClipboardEvent): void {
			handlePlainPaste(event, el);
		}

		el.addEventListener("keydown", onKey);
		el.addEventListener("blur", onBlur);
		el.addEventListener("paste", onPaste);
		activeEdit = { el, commit: commitEdit, cancel: cancelEdit };
	}

	/* --- tag-list editing ([data-edit-list] / [data-edit-item]) --- */

	function ensureAddChip(list: HTMLElement, key: string): void {
		list.querySelector(ADD_CHIP_SELECTOR)?.remove();
		const chip = document.createElement("button");
		chip.type = "button";
		chip.setAttribute("data-edit-add-chip", "");
		chip.dataset.editListKey = key;
		chip.setAttribute("aria-label", "Add item");
		chip.textContent = "+";
		list.appendChild(chip);
	}

	/**
	 * Scans every `[data-edit-list]` currently in the document and injects a "+"
	 * chip into any that doesn't have one yet. Safe to call repeatedly — lists
	 * that already have a chip are left untouched (no-op, so this doesn't loop
	 * against its own MutationObserver below).
	 */
	function ensureAllAddChips(): void {
		document.querySelectorAll<HTMLElement>("[data-edit-list]").forEach((list) => {
			if (list.querySelector(ADD_CHIP_SELECTOR)) return;
			const key = list.getAttribute("data-edit-list");
			if (key) ensureAddChip(list, key);
		});
	}

	// SvelteKit client-side navigation swaps the routed page's DOM in place
	// without remounting the root layout (so this session is never re-created).
	// Freshly-mounted `[data-edit-list]` containers on the new page have no "+"
	// chip until we re-scan for them; a MutationObserver catches every such swap
	// without depending on SvelteKit's own navigation lifecycle hooks.
	let listObserver: MutationObserver | null = null;
	function startListObserver(): void {
		listObserver = new MutationObserver(() => ensureAllAddChips());
		listObserver.observe(document.body, { childList: true, subtree: true });
	}
	function stopListObserver(): void {
		listObserver?.disconnect();
		listObserver = null;
	}

	async function commitList(list: HTMLElement, key: string, arr: string[]): Promise<void> {
		commit(key, arr);
		await tick();
		ensureAddChip(list, key);
	}

	function beginListItemEdit(item: HTMLElement, list: HTMLElement): void {
		const key = list.getAttribute("data-edit-list");
		if (!key) return;
		const indexAttr = item.getAttribute("data-edit-item");
		const index = indexAttr != null ? Number.parseInt(indexAttr, 10) : -1;
		if (index < 0) return;
		const original = item.textContent ?? "";
		let done = false;

		item.classList.add(EDITING_CLASS);
		makeEditable(item);
		item.focus();
		placeCursorAtEnd(item);

		function cleanup(): void {
			item.removeEventListener("keydown", onKey);
			item.removeEventListener("blur", onBlur);
			item.removeEventListener("paste", onPaste);
			item.removeAttribute("contenteditable");
			item.classList.remove(EDITING_CLASS);
			activeEdit = null;
		}
		function finish(useOriginal: boolean): void {
			if (done) return;
			done = true;
			const text = (useOriginal ? original : (item.textContent ?? "")).replace(/\r?\n/g, " ").trim();
			cleanup();
			const arr = [...cList(key!)];
			if (text === "") {
				if (index < arr.length) arr.splice(index, 1);
			} else {
				arr[index] = text;
			}
			void commitList(list, key!, arr);
		}
		function onKey(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				finish(true);
			} else if (event.key === "Enter") {
				event.preventDefault();
				finish(false);
			}
		}
		function onBlur(): void {
			finish(false);
		}
		function onPaste(event: ClipboardEvent): void {
			handlePlainPaste(event, item);
		}

		item.addEventListener("keydown", onKey);
		item.addEventListener("blur", onBlur);
		item.addEventListener("paste", onPaste);
		activeEdit = { el: item, commit: () => finish(false), cancel: () => finish(true) };
	}

	async function handleAddChip(chip: HTMLElement): Promise<void> {
		const key = chip.dataset.editListKey;
		const list = chip.closest<HTMLElement>("[data-edit-list]");
		if (!key || !list) return;
		// Local-only append (no post) so the parent never sees the transient empty
		// pill; the pill's own commit posts the final array.
		applyLocal(key, [...cList(key), ""]);
		await tick();
		ensureAddChip(list, key);
		const items = list.querySelectorAll<HTMLElement>("[data-edit-item]");
		const last = items[items.length - 1];
		if (last) beginListItemEdit(last, list);
	}

	/* --- link URL editing ([data-edit-href]) --- */

	function openLinkEditor(link: HTMLElement): void {
		const urlKey = link.getAttribute("data-edit-href");
		if (!urlKey) return;
		const labelKey = link.getAttribute("data-edit");
		requestLinkEdit({
			labelKey,
			urlKey,
			label: labelKey ? c(labelKey) : "",
			url: link.getAttribute("href") ?? c(urlKey),
			rect: link.getBoundingClientRect()
		});
	}

	/* --- click delegation (capture phase) --- */

	function onClick(event: MouseEvent): void {
		const target = event.target as HTMLElement | null;
		if (!target) return;

		// Clicks inside the element being edited place the caret normally.
		if (activeEdit && activeEdit.el.contains(target)) return;

		const addChip = target.closest<HTMLElement>(ADD_CHIP_SELECTOR);
		if (addChip) {
			event.preventDefault();
			event.stopPropagation();
			finishActive();
			void handleAddChip(addChip);
			return;
		}

		// Links (incl. those that also carry data-edit for their label) → popover.
		const link = target.closest<HTMLElement>("[data-edit-href]");
		if (link) {
			event.preventDefault();
			event.stopPropagation();
			finishActive();
			openLinkEditor(link);
			return;
		}

		const item = target.closest<HTMLElement>("[data-edit-item]");
		if (item && item.closest("[data-edit-list]")) {
			const list = item.closest<HTMLElement>("[data-edit-list]")!;
			event.preventDefault();
			event.stopPropagation();
			finishActive();
			beginListItemEdit(item, list);
			return;
		}

		const editable = target.closest<HTMLElement>("[data-edit]");
		if (editable) {
			event.preventDefault();
			event.stopPropagation();
			finishActive();
			beginTextEdit(editable);
		}
	}

	/* --- styles --- */

	function injectStyles(): void {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement("style");
		style.id = STYLE_ID;
		style.textContent = `
body.${ACTIVE_CLASS} [data-edit]:not([contenteditable]):hover,
body.${ACTIVE_CLASS} [data-edit-item]:not([contenteditable]):hover {
	outline: 1px dashed #8b5cf6;
	outline-offset: 3px;
	border-radius: 2px;
	cursor: text;
}
body.${ACTIVE_CLASS} [data-edit-href]:hover {
	outline: 1px dashed #8b5cf6;
	outline-offset: 3px;
	border-radius: 2px;
	cursor: pointer;
}
body.${ACTIVE_CLASS} .${EDITING_CLASS} {
	outline: 2px solid #8b5cf6 !important;
	outline-offset: 3px;
	border-radius: 2px;
	cursor: text;
}
body.${ACTIVE_CLASS} [data-edit-add-chip] {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.5rem;
	height: 1.5rem;
	padding: 0 0.4rem;
	margin-left: 0.35rem;
	border: 1px dashed #8b5cf6;
	border-radius: 9999px;
	color: #8b5cf6;
	font-size: 0.85rem;
	line-height: 1;
	background: transparent;
	cursor: pointer;
	vertical-align: middle;
}
body.${ACTIVE_CLASS} [data-edit-add-chip]:hover {
	background: rgba(139, 92, 246, 0.12);
}`;
		document.head.appendChild(style);
	}

	/* --- lifecycle --- */

	injectStyles();
	document.body.classList.add(ACTIVE_CLASS);
	ensureAllAddChips();
	startListObserver();
	document.addEventListener("click", onClick, true);
	window.addEventListener("message", onMessage);
	startReadyRetry();

	function destroy(): void {
		if (activeEdit) activeEdit.cancel();
		stopReadyRetry();
		stopListObserver();
		document.removeEventListener("click", onClick, true);
		window.removeEventListener("message", onMessage);
		document.querySelectorAll(ADD_CHIP_SELECTOR).forEach((chip) => chip.remove());
		document.body.classList.remove(ACTIVE_CLASS);
		document.getElementById(STYLE_ID)?.remove();
	}

	return { commit, commitLink, destroy };
}
