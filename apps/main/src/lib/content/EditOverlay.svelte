<!--
	EditOverlay — the visible chrome of edit mode.

	Mounted only when the URL activates edit mode (see +layout.svelte). It owns the
	link-editing popover; all DOM wiring (hover outlines, inline text/tag editing,
	handshake) lives in the imperative edit session created here. On destroy the
	session tears everything down.
-->
<script lang="ts">
	import { onMount } from "svelte";
	import { createEditSession, type EditSession, type LinkEditRequest } from "./edit-mode.js";

	let { studioOrigin }: { studioOrigin: string } = $props();

	let session: EditSession | null = null;

	interface PopoverState {
		labelKey: string | null;
		urlKey: string;
		label: string;
		url: string;
		x: number;
		y: number;
	}
	let popover = $state<PopoverState | null>(null);
	let urlInput = $state<HTMLInputElement | null>(null);

	onMount(() => {
		session = createEditSession({
			studioOrigin,
			requestLinkEdit(req: LinkEditRequest) {
				popover = {
					labelKey: req.labelKey,
					urlKey: req.urlKey,
					label: req.label,
					url: req.url,
					// Clamp within the viewport so the popover stays reachable.
					x: Math.min(req.rect.left, window.innerWidth - 300),
					y: Math.min(req.rect.bottom + 8, window.innerHeight - 160)
				};
			}
		});
		return () => {
			session?.destroy();
			session = null;
		};
	});

	// Focus the URL field whenever the popover opens.
	$effect(() => {
		if (popover && urlInput) urlInput.focus();
	});

	function confirmPopover() {
		if (!popover || !session) return;
		session.commitLink({
			labelKey: popover.labelKey,
			urlKey: popover.urlKey,
			label: popover.label,
			url: popover.url.trim()
		});
		popover = null;
	}

	function cancelPopover() {
		popover = null;
	}

	function onPopoverKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			confirmPopover();
		} else if (event.key === "Escape") {
			event.preventDefault();
			cancelPopover();
		}
	}
</script>

{#if popover}
	<div
		class="fixed z-[9999] flex w-72 flex-col gap-2 rounded-lg border border-[#8b5cf6]/40 bg-white p-3 text-sm text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100"
		style="left: {popover.x}px; top: {popover.y}px;"
		role="dialog"
		aria-label="Edit link"
		tabindex="-1"
		onkeydown={onPopoverKeydown}
	>
		{#if popover.labelKey}
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium opacity-70">Text</span>
				<input
					class="rounded border border-slate-300 bg-transparent px-2 py-1 outline-none focus:border-[#8b5cf6] dark:border-slate-600"
					bind:value={popover.label}
				/>
			</label>
		{/if}
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium opacity-70">URL</span>
			<input
				bind:this={urlInput}
				class="rounded border border-slate-300 bg-transparent px-2 py-1 outline-none focus:border-[#8b5cf6] dark:border-slate-600"
				bind:value={popover.url}
			/>
		</label>
		<div class="mt-1 flex justify-end gap-2">
			<button
				type="button"
				class="rounded px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
				onclick={cancelPopover}
			>
				Cancel
			</button>
			<button
				type="button"
				class="rounded bg-[#8b5cf6] px-3 py-1 text-xs font-medium text-white hover:bg-[#7c3aed]"
				onclick={confirmPopover}
			>
				OK
			</button>
		</div>
	</div>
{/if}
