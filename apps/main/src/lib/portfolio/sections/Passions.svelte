<script lang="ts">
	import { c, cList } from "$lib/content/index.js";
</script>

<section id="passions" class="px-6 py-20">
	<div class="mx-auto max-w-6xl">
		<div class="mb-16 text-center">
			<h2
				class="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
				data-edit="home.passions.title"
			>
				{c("home.passions.title")}
			</h2>
			<p class="text-muted-foreground mx-auto max-w-2xl text-lg" data-edit="home.passions.subtitle">
				{c("home.passions.subtitle")}
			</p>
		</div>

		<div class="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
			<!-- Photography -->
			<div class="space-y-6">
				<div class="flex items-center space-x-4">
					<div class="bg-foreground/10 flex h-12 w-12 items-center justify-center rounded-full">
						<svg
							class="text-foreground h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
					</div>
					<h3 class="text-foreground text-2xl font-bold" data-edit="home.passions.photography.title">
						{c("home.passions.photography.title")}
					</h3>
				</div>

				<p
					class="text-muted-foreground text-lg leading-relaxed"
					data-edit="home.passions.photography.description"
				>
					{c("home.passions.photography.description")}
				</p>

				<div class="grid grid-cols-2 gap-4">
					<div class="border-border/20 aspect-square overflow-hidden rounded-lg border">
						<img
							src="/portfolio/DSCF0404.jpg"
							alt="Mountains in Savoie, France"
							class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
							loading="lazy"
						/>
					</div>
					<div class="border-border/20 aspect-square overflow-hidden rounded-lg border">
						<img
							src="/portfolio/20160624.jpg"
							alt="Sunset picture in Danmark"
							class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
							loading="lazy"
						/>
					</div>
				</div>
			</div>

			<!-- Music/Guitar -->
			<div class="space-y-6">
				<div class="flex items-center space-x-4">
					<div class="bg-foreground/10 flex h-12 w-12 items-center justify-center rounded-full">
						<svg
							class="text-foreground h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
							></path>
						</svg>
					</div>
					<h3 class="text-foreground text-2xl font-bold" data-edit="home.passions.music.title">
						{c("home.passions.music.title")}
					</h3>
				</div>

				<p
					class="text-muted-foreground text-lg leading-relaxed"
					data-edit="home.passions.music.description"
				>
					{c("home.passions.music.description")}
				</p>

				<div class="flex flex-wrap gap-2" data-edit-list="home.passions.music.tags">
					{#each cList("home.passions.music.tags") as t, i}
						<span
							class="bg-foreground/10 text-foreground rounded-full px-3 py-1 text-sm"
							data-edit-item={i}>{t}</span
						>
					{/each}
				</div>
			</div>
		</div>

		<!-- Gear Section -->
		<div class="border-border/20 border-t pt-16">
			<div class="mb-12 text-center">
				<h3
					class="text-foreground mb-4 text-2xl font-bold tracking-tight sm:text-3xl"
					data-edit="home.passions.gear.title"
				>
					{c("home.passions.gear.title")}
				</h3>
				<p class="text-muted-foreground" data-edit="home.passions.gear.subtitle">
					{c("home.passions.gear.subtitle")}
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				<!-- Development -->
				<div class="space-y-4">
					<h4 class="text-foreground flex items-center text-lg font-semibold">
						<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
							<line x1="8" y1="21" x2="16" y2="21"></line>
							<line x1="12" y1="17" x2="12" y2="21"></line>
						</svg>
						<span data-edit="home.passions.gear.development.title"
							>{c("home.passions.gear.development.title")}</span
						>
					</h4>
					<ul class="text-muted-foreground space-y-2" data-edit-list="home.passions.gear.development.items">
						{#each cList("home.passions.gear.development.items") as t, i}
							<li>&#8226; <span data-edit-item={i}>{t}</span></li>
						{/each}
					</ul>
				</div>

				<!-- Photography -->
				<div class="space-y-4">
					<h4 class="text-foreground flex items-center text-lg font-semibold">
						<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
						<span data-edit="home.passions.gear.photography.title"
							>{c("home.passions.gear.photography.title")}</span
						>
					</h4>
					<ul class="text-muted-foreground space-y-2" data-edit-list="home.passions.gear.photography.items">
						{#each cList("home.passions.gear.photography.items") as t, i}
							<li>&#8226; <span data-edit-item={i}>{t}</span></li>
						{/each}
					</ul>
				</div>

				<!-- Music -->
				<div class="space-y-4">
					<h4 class="text-foreground flex items-center text-lg font-semibold">
						<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
							></path>
						</svg>
						<span data-edit="home.passions.gear.music.title">{c("home.passions.gear.music.title")}</span>
					</h4>
					<ul class="text-muted-foreground space-y-2" data-edit-list="home.passions.gear.music.items">
						{#each cList("home.passions.gear.music.items") as t, i}
							<li>&#8226; <span data-edit-item={i}>{t}</span></li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>
