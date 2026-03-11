<script lang="ts">
	import type { ExifData } from '$lib/types/index.js';
	import { cn } from '$lib/utils.js';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import ApertureIcon from '@lucide/svelte/icons/aperture';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import FocusIcon from '@lucide/svelte/icons/focus';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	interface Props {
		exif: ExifData;
		class?: string;
		compact?: boolean;
	}

	let { exif, class: className, compact = false }: Props = $props();

	let items = $derived(
		[
			{ icon: CameraIcon, label: 'Camera', value: exif.camera },
			{ icon: FocusIcon, label: 'Lens', value: exif.lens },
			{ icon: ApertureIcon, label: 'Aperture', value: exif.aperture },
			{ icon: TimerIcon, label: 'Shutter', value: exif.shutterSpeed },
			{ icon: ZapIcon, label: 'ISO', value: exif.iso?.toString() },
			{ icon: FocusIcon, label: 'Focal Length', value: exif.focalLength },
			{ icon: CalendarIcon, label: 'Date', value: exif.dateTaken ? new Date(exif.dateTaken).toLocaleDateString() : undefined },
			{ icon: MapPinIcon, label: 'Location', value: exif.location?.name }
		].filter((item) => item.value)
	);
</script>

{#if items.length > 0}
	<div class={cn(compact ? 'flex flex-wrap gap-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
		{#each items as item}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<item.icon class="h-4 w-4 shrink-0" />
				{#if compact}
					<span>{item.value}</span>
				{:else}
					<div>
						<p class="text-xs uppercase tracking-wide opacity-60">{item.label}</p>
						<p class="font-medium text-foreground">{item.value}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
