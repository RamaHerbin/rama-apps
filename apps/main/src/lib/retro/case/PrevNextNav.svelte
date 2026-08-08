<script lang="ts">
	/**
	 * End-of-page pager, identical on all three case pages: two pressable cards,
	 * the right one filled and right-aligned so the forward move is the loud one.
	 *
	 * Each side takes EITHER a `titleKey` (content, editable) or a plain `title` —
	 * the standard tree's PrevNext does the same, because some targets name a page
	 * whose title already lives under another namespace ("personal.hero.title")
	 * while others are one-off labels.
	 */
	import { c } from "$lib/content/index.js";

	interface NavCell {
		/** content key for the eyebrow, e.g. "fdp.prev-next.prev.eyebrow" */
		kickerKey: string;
		/** content key for the target title — takes precedence over `title` */
		titleKey?: string;
		/** literal target title, when no content key owns it */
		title?: string;
		href: string;
	}

	interface Props {
		prev?: NavCell;
		next?: NavCell;
	}

	let { prev, next }: Props = $props();
</script>

<div class="flex flex-col gap-[18px] sm:flex-row">
	{#if prev}
		<a
			class="r-border r-shadow-3 r-pressable flex flex-1 flex-col gap-1 bg-[var(--r-paper)] px-5 py-4"
			href={prev.href}
		>
			<span
				class="r-mono text-[10px] font-bold tracking-[1px] text-[var(--r-muted)]"
				data-edit={prev.kickerKey}>{c(prev.kickerKey)}</span
			>
			<!-- Text kept flush against the tags: the edit runtime commits an element's
			     raw textContent, so indentation around the expression would be saved. -->
			<span class="text-[16px] font-bold" data-edit={prev.titleKey}
				>{prev.titleKey ? c(prev.titleKey) : prev.title}</span
			>
		</a>
	{/if}

	{#if next}
		<a
			class="r-border r-shadow-3 r-pressable flex flex-1 flex-col items-end gap-1 bg-[var(--r-btn)] px-5 py-4 text-right"
			href={next.href}
		>
			<span
				class="r-mono text-[10px] font-bold tracking-[1px] text-[var(--r-muted)]"
				data-edit={next.kickerKey}>{c(next.kickerKey)}</span
			>
			<span class="text-[16px] font-bold" data-edit={next.titleKey}
				>{next.titleKey ? c(next.titleKey) : next.title}</span
			>
		</a>
	{/if}
</div>
