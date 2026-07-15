<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Avatar from "$lib/portfolio/Avatar.svelte";

	interface Props {
		img: string;
		/** optional WebP source for the avatar; falls back to `img` when absent */
		imgWebp?: string;
		name: string;
		/** content key for `name`; enables click-to-edit when set */
		nameKey?: string;
		username: string;
		body: string;
		/** content key for `body`; enables click-to-edit when set */
		bodyKey?: string;
		linkedinUrl: string;
		/** content key for `linkedinUrl`; enables the link edit popover when set */
		linkedinHrefKey?: string;
		date: string;
		/** content key for `date`; enables click-to-edit when set */
		dateKey?: string;
		/** opens the full recommendation (clicking the card, or the "Read more" button) */
		onOpen?: () => void;
		/** show the "Read more" button (only when there's more than the excerpt) */
		showReadMore?: boolean;
		class?: string;
	}

	let {
		img,
		imgWebp,
		name,
		nameKey,
		username,
		body,
		bodyKey,
		linkedinUrl,
		linkedinHrefKey,
		date,
		dateKey,
		onOpen,
		showReadMore = false,
		class: className
	}: Props = $props();
</script>

<!--
	Deliberately NOT a card-wide <a> (as the pre-edit-mode design had it): the
	edit runtime's click delegation resolves the nearest [data-edit-href]
	ancestor before it ever considers [data-edit]/[data-edit-item] (see
	edit-mode.ts onClick), so a card-wide link would swallow every click on the
	name/date/body text and make them permanently un-editable. Only the avatar
	is a link to the LinkedIn profile; the rest of the card is plain content.

	The card DOES open the full-testimonial dialog on click (onOpen) — an onclick,
	not a link, so the edit runtime's capture-phase handler still intercepts
	[data-edit] clicks first. The avatar link and "Read more" button stopPropagation
	so they don't also trigger it.
-->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<figure
	onclick={onOpen}
	class={cn(
		"relative block w-95 overflow-hidden rounded-xl border p-4 transition-all duration-300",
		"border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
		"dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
		onOpen && "cursor-pointer",
		className
	)}
>
	<div class="flex flex-row items-center gap-2">
		<!--
			`href` is dropped when the URL is empty (we don't have every profile URL
			yet) so it renders as a plain avatar rather than a dead link. The
			data-edit-href stays either way, so the studio link popover can still
			fill it in.
		-->
		<a
			href={linkedinUrl || undefined}
			data-edit-href={linkedinHrefKey}
			target="_blank"
			rel="noopener noreferrer"
			onclick={(e) => e.stopPropagation()}
			class="shrink-0 cursor-pointer"
			aria-label={linkedinUrl ? `Open ${name}'s LinkedIn profile` : undefined}
		>
			<Avatar src={img} webp={imgWebp} {name} size={32} class="h-8 w-8" />
		</a>
		<div class="flex flex-col">
			<div class="text-sm font-medium dark:text-white" data-edit={nameKey}>{name}</div>
			<p class="text-xs font-medium dark:text-white/60">{username}</p>
		</div>
		<span class="text-muted-foreground ml-auto text-xs" data-edit={dateKey}>{date}</span>
	</div>
	<blockquote class="mt-2 text-sm" data-edit={bodyKey}>{body}</blockquote>

	<!--
		Deliberately OUTSIDE the [data-edit] blockquote: the edit runtime's click
		delegation only swallows clicks that resolve to a [data-edit-href],
		[data-edit-item] or [data-edit] ancestor, so a button sitting next to them
		keeps working in edit mode instead of turning into a text caret.
	-->
	{#if showReadMore}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground mt-3 cursor-pointer text-xs font-medium underline underline-offset-2 transition-colors"
			onclick={(e) => {
				e.stopPropagation();
				onOpen?.();
			}}
		>
			Read more
		</button>
	{/if}

	<figcaption class="sr-only">Review by {name}</figcaption>
</figure>
