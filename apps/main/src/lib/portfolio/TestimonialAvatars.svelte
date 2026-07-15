<script lang="ts" module>
	export interface AvatarItem {
		id: number | string;
		name: string;
		designation: string;
		image: string;
		/** LinkedIn profile URL; the avatar links out when present */
		href?: string;
	}
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { scale } from "svelte/transition";

	interface Props {
		items: AvatarItem[];
		/** Fired with the hovered/focused avatar id, or null when it leaves. */
		onHoverChange?: (id: number | string | null) => void;
		class?: string;
	}

	let { items, onHoverChange, class: className }: Props = $props();

	// Faithful port of fancy-ui-svelte's AnimatedTooltip, with one change: each
	// avatar is wrapped in an <a> so clicking a colleague opens their LinkedIn
	// profile (the section subtitle promises this, but the package component
	// renders a plain <img> with no link). Ideally this href support lands
	// upstream in fancy-ui; kept local for now.
	let hoveredIndex = $state<number | string | null>(null);
	let mouseX = $state(0);

	let rotation = $derived((mouseX / 100) * 50);
	let translation = $derived((mouseX / 100) * 50);

	function handleMouseEnter(event: MouseEvent, itemId: number | string) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = event.clientX - rect.left - rect.width / 2;
		hoveredIndex = itemId;
		onHoverChange?.(itemId);
	}

	function handleMouseMove(event: MouseEvent) {
		if (hoveredIndex === null) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = event.clientX - rect.left - rect.width / 2;
	}

	function handleMouseLeave() {
		hoveredIndex = null;
		mouseX = 0;
		onHoverChange?.(null);
	}

	// Keyboard parity: focusing an avatar (tab) centres its card too.
	function handleFocus(itemId: number | string) {
		hoveredIndex = itemId;
		onHoverChange?.(itemId);
	}

	function handleBlur() {
		hoveredIndex = null;
		mouseX = 0;
		onHoverChange?.(null);
	}

	const avatarClass =
		"relative !m-0 block size-14 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105";
</script>

<div class={cn("flex flex-row items-center", className)}>
	{#each items as item (item.id)}
		<div
			class="group relative -mr-4"
			onmouseenter={(e) => handleMouseEnter(e, item.id)}
			onmouseleave={handleMouseLeave}
			onmousemove={handleMouseMove}
			onfocusin={() => handleFocus(item.id)}
			onfocusout={handleBlur}
			role="button"
			tabindex="0"
		>
			{#if hoveredIndex === item.id}
				<div
					class="pointer-events-none absolute -top-16 left-1/2 z-50 flex flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs whitespace-nowrap shadow-xl"
					style="transform: translateX(calc(-50% + {translation}px)) rotate({rotation}deg);"
					transition:scale={{ duration: 200, start: 0.6 }}
				>
					<div
						class="absolute right-1/2 -bottom-px z-30 me-1 h-px w-2/5 translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
					></div>
					<div
						class="absolute -bottom-px left-1/2 z-30 ms-1 h-px w-2/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-500 to-transparent"
					></div>
					<div class="relative z-30 text-base font-bold text-white">{item.name}</div>
					<div class="text-xs text-white">{item.designation}</div>
				</div>
			{/if}

			{#if item.href}
				<a
					href={item.href}
					target="_blank"
					rel="noopener noreferrer"
					class="cursor-pointer"
					aria-label={`Open ${item.name}'s LinkedIn profile`}
				>
					<img src={item.image} alt={item.name} class={avatarClass} />
				</a>
			{:else}
				<img src={item.image} alt={item.name} class={avatarClass} />
			{/if}
		</div>
	{/each}
</div>
