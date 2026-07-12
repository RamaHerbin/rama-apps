<script lang="ts">
	import { onMount } from "svelte";
	import { BlurReveal } from "fancy-ui-svelte";
	import { c } from "$lib/content/index.js";

	let isMobile = $state(false);

	function checkMobile() {
		if (typeof window !== "undefined") {
			isMobile =
				window.innerWidth < 768 ||
				/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		}
	}

	onMount(() => {
		checkMobile();
		const handleResize = () => checkMobile();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	});
</script>

{#if !isMobile}
	<BlurReveal delay={0.15} duration={0.6} class="inline-block">
		<div
			class="border-border/20 bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] backdrop-blur-md transition"
			aria-label="This site aims for a low-carbon footprint"
		>
			🌱
			<span class="text-muted-foreground tracking-tight">
				<span class="whitespace-nowrap" data-edit="shared.carbon.label">{c("shared.carbon.label")}</span>
				<span class="text-foreground" data-edit="shared.carbon.status">{c("shared.carbon.status")}</span>
			</span>
			<a
				href={c("shared.carbon.link.href")}
				data-edit="shared.carbon.link.label"
				data-edit-href="shared.carbon.link.href"
				class="text-muted-foreground/60 decoration-border/20 hover:text-muted-foreground hover:decoration-border/40 ml-1 whitespace-nowrap underline underline-offset-2 transition"
			>
				{c("shared.carbon.link.label")}
			</a>
		</div>
	</BlurReveal>
{:else}
	<div
		class="border-border/20 bg-muted/60 text-muted-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]"
		aria-label="This site aims for a low-carbon footprint"
	>
		🌱
		<span class="text-muted-foreground tracking-tight">
			<span class="whitespace-nowrap" data-edit="shared.carbon.label">{c("shared.carbon.label")}</span>
			<span class="text-foreground" data-edit="shared.carbon.status">{c("shared.carbon.status")}</span>
		</span>
		<a
			href={c("shared.carbon.link.href")}
			data-edit="shared.carbon.link.label"
			data-edit-href="shared.carbon.link.href"
			class="text-muted-foreground/60 decoration-border/20 ml-1 whitespace-nowrap underline underline-offset-2"
		>
			{c("shared.carbon.link.label")}
		</a>
	</div>
{/if}
