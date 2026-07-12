<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		img: string;
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
		class?: string;
	}

	let {
		img,
		name,
		nameKey,
		username,
		body,
		bodyKey,
		linkedinUrl,
		linkedinHrefKey,
		date,
		dateKey,
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
-->
<figure
	class={cn(
		"relative block w-75 overflow-hidden rounded-xl border p-4 transition-all duration-300",
		"border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
		"dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
		className
	)}
>
	<div class="flex flex-row items-center gap-2">
		<a
			href={linkedinUrl}
			data-edit-href={linkedinHrefKey}
			target="_blank"
			rel="noopener noreferrer"
			class="shrink-0 cursor-pointer"
			aria-label={`Open ${name}'s LinkedIn profile`}
		>
			<img
				class="h-8 w-8 rounded-full object-cover"
				width="32"
				height="32"
				alt={`Profile picture of ${name}`}
				src={img}
			/>
		</a>
		<div class="flex flex-col">
			<div class="text-sm font-medium dark:text-white" data-edit={nameKey}>{name}</div>
			<p class="text-xs font-medium dark:text-white/60">{username}</p>
		</div>
		<span class="text-muted-foreground ml-auto text-xs" data-edit={dateKey}>{date}</span>
	</div>
	<blockquote class="mt-2 text-sm" data-edit={bodyKey}>{body}</blockquote>
	<figcaption class="sr-only">Review by {name}</figcaption>
</figure>
