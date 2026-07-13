<script lang="ts">
	import { AnimatedTooltip, Marquee } from "fancy-ui-svelte";
	import ReviewCard from "$lib/portfolio/ReviewCard.svelte";
	import { c } from "$lib/content/index.js";
	import type { Testimonial } from "$lib/portfolio/types.js";

	// Avatar images are out of scope for content-editing (see EDIT-CONTRACT.md) —
	// kept local, keyed by testimonial id, alongside the content-driven fields.
	const testimonialImages: Record<number, string> = {
		1: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
		2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
		3: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=1000&q=80",
		4: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
		5: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=1000&q=80"
	};

	const testimonialIds = [1, 2, 3, 4, 5];

	const testimonials: Testimonial[] = testimonialIds.map((id) => ({
		id,
		name: c(`testimonials.${id}.name`),
		designation: c(`testimonials.${id}.designation`),
		image: testimonialImages[id],
		testimonial: c(`testimonials.${id}.testimonial`),
		linkedinUrl: c(`testimonials.${id}.linkedin.href`),
		date: c(`testimonials.${id}.date`)
	}));

	const tooltipItems = testimonials.map((t) => ({
		id: t.id,
		name: t.name,
		designation: t.designation,
		image: t.image
	}));
</script>

<section id="testimonials" class="px-6 py-20">
	<div class="mx-auto max-w-6xl">
		<div class="mb-16 text-center">
			<h2
				class="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
				data-edit="home.testimonials.title"
			>
				{c("home.testimonials.title")}
			</h2>
			<p
				class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg"
				data-edit="home.testimonials.subtitle"
			>
				{c("home.testimonials.subtitle")}
			</p>
		</div>

		<!-- AnimatedTooltip -->
		<div class="flex w-full flex-row items-center justify-center">
			<AnimatedTooltip items={tooltipItems} />
		</div>

		<!-- Marquee -->
		<div
			class="bg-background relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-lg md:shadow-xl"
		>
			<Marquee reverse pauseOnHover class="[--duration:20s]">
				{#each testimonials as review (review.id)}
					<ReviewCard
						img={review.image}
						name={review.name}
						nameKey={`testimonials.${review.id}.name`}
						username={review.name}
						body={review.testimonial}
						bodyKey={`testimonials.${review.id}.testimonial`}
						linkedinUrl={review.linkedinUrl}
						linkedinHrefKey={`testimonials.${review.id}.linkedin.href`}
						date={review.date}
						dateKey={`testimonials.${review.id}.date`}
					/>
				{/each}
			</Marquee>

			<!-- Left Gradient -->
			<div
				class="dark:from-background pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white"
			></div>

			<!-- Right Gradient -->
			<div
				class="dark:from-background pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white"
			></div>
		</div>
	</div>
</section>
