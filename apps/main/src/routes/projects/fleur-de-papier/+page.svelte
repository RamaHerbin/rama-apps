<script lang="ts">
	import { NavAnchor, Footer } from "$lib/portfolio/index.js";
</script>

<svelte:head>
	<title>Fleur de Papier Projects - Rama Herbin</title>
	<meta
		name="description"
		content="Creative web applications developed at Fleur de Papier cultural mediation agency. Interactive digital experiences for museums and cultural institutions."
	/>
</svelte:head>

<div class="min-h-screen">
	<!-- Navigation -->
	<NavAnchor />

	<!-- Hero Section -->
	<section class="pt-32 pb-16 px-6">
		<div class="max-w-4xl mx-auto">
			<!-- Back Button -->
			<a
				href="/#projects"
				class="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					></path>
				</svg>
				Back to Portfolio
			</a>

			<!-- Title -->
			<div class="space-y-4 mb-12">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
					Fleur de Papier
				</h1>
				<p class="text-xl text-muted-foreground">
					Cultural Mediation Agency • Creative Web Applications
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded-full"
						>Vue 3</span
					>
					<span class="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded-full"
						>Nuxt</span
					>
					<span class="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded-full"
						>JavaScript</span
					>
					<span class="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded-full"
						>Creative Development</span
					>
					<span class="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded-full"
						>Cultural Tech</span
					>
				</div>
			</div>

			<!-- Description -->
			<div class="prose prose-lg max-w-none text-muted-foreground space-y-6">
				<p class="text-lg leading-relaxed">
					During my time at <strong class="text-foreground">Fleur de Papier</strong>, a cultural
					mediation agency, I developed innovative web applications that bridged the gap between
					art, technology and public engagement.
				</p>

				<p class="text-lg leading-relaxed">
					Our mission was to create
					<strong class="text-foreground">interactive digital experiences</strong>
					that made cultural content more accessible and engaging for diverse audiences, working
					with museums, cultural institutions, and artistic organizations.
				</p>
			</div>
		</div>
	</section>

	<!-- Projects Showcase -->
	<section class="py-16 px-6">
		<div class="max-w-6xl mx-auto">
			<h2 class="text-3xl font-bold text-foreground mb-12 text-center">Featured Projects</h2>

			<!-- Note about content -->
			<div class="bg-card border border-border/20 rounded-lg p-6 mb-12">
				<div class="flex items-start space-x-3">
					<svg
						class="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<h3 class="font-semibold text-foreground mb-2">Project Documentation</h3>
						<p class="text-muted-foreground text-sm">
							Detailed project showcases are currently being prepared. Video demonstrations and
							case studies will be added pending approval from the agency for public
							presentation.
						</p>
					</div>
				</div>
			</div>

			<!-- Placeholder for future projects -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<!-- Project Placeholder 1 -->
				<div class="border border-dashed border-border/40 rounded-lg p-8 text-center">
					<div
						class="w-16 h-16 mx-auto mb-4 rounded-lg bg-foreground/5 flex items-center justify-center"
					>
						<svg
							class="w-8 h-8 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-foreground mb-2">Interactive Cultural App</h3>
					<p class="text-muted-foreground text-sm">Video demonstration coming soon</p>
				</div>

				<!-- Project Placeholder 2 -->
				<div class="border border-dashed border-border/40 rounded-lg p-8 text-center">
					<div
						class="w-16 h-16 mx-auto mb-4 rounded-lg bg-foreground/5 flex items-center justify-center"
					>
						<svg
							class="w-8 h-8 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-foreground mb-2">Museum Digital Experience</h3>
					<p class="text-muted-foreground text-sm">Case study in preparation</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Skills & Technologies -->
	<section class="py-16 px-6 bg-muted/20">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold text-foreground mb-8 text-center">Technologies & Approach</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h3 class="text-lg font-semibold text-foreground mb-4">Technical Stack</h3>
					<ul class="space-y-2 text-muted-foreground">
						<li>• VueJS for interactive interfaces</li>
						<li>• JavaScript ES6+ for modern functionality</li>
						<li>• CSS3 animations and transitions</li>
						<li>• Responsive design principles</li>
						<li>• Accessibility-first development</li>
					</ul>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-foreground mb-4">Creative Focus</h3>
					<ul class="space-y-2 text-muted-foreground">
						<li>• User-centered cultural experiences</li>
						<li>• Interactive storytelling</li>
						<li>• Cross-generational accessibility</li>
						<li>• Performance optimization</li>
						<li>• Creative problem-solving</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<Footer />
</div>
