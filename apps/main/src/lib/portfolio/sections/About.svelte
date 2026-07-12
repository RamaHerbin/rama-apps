<script lang="ts">
	import { c } from "$lib/content/index.js";
</script>

<section id="about" class="px-6 py-20">
	<div class="mx-auto max-w-4xl">
		<div class="mb-16 text-center">
			<h2
				class="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
				data-edit="home.about.title"
			>
				{c("home.about.title")}
			</h2>
		</div>

		<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
			<div class="space-y-6">
				<p class="text-muted-foreground text-lg leading-relaxed sm:text-xl">
					<span data-edit="home.about.intro">{c("home.about.intro")}</span>
					<a
						href={c("home.hero.ansys.href")}
						data-edit="home.hero.ansys.label"
						data-edit-href="home.hero.ansys.href"
						target="_blank"
						rel="noopener noreferrer"
						class="text-foreground font-semibold underline-offset-4 hover:underline"
						aria-label="Open Ansys website in a new tab"
					>
						{c("home.hero.ansys.label")}
					</a>
					<span class="text-foreground/80" data-edit="home.about.company-part"
						>{c("home.about.company-part")}</span
					>
					<span
						class="text-foreground/90 align-baseline text-[0.9em]"
						data-edit="home.about.parent-company">{c("home.about.parent-company")}</span
					><span data-edit="home.about.creative-foundation"
						>{c("home.about.creative-foundation")}</span
					>
					<span class="text-foreground font-semibold" data-edit="home.about.gobelins"
						>{c("home.about.gobelins")}</span
					>.
				</p>

				<p
					class="text-muted-foreground text-lg leading-relaxed sm:text-xl"
					data-edit="home.about.paragraph-2"
				>
					{c("home.about.paragraph-2")}
				</p>

				<p
					class="text-muted-foreground text-lg leading-relaxed sm:text-xl"
					data-edit="home.about.paragraph-3"
				>
					{c("home.about.paragraph-3")}
				</p>
			</div>

			<div class="flex justify-center lg:justify-end">
				<div
					class="border-muted-foreground/20 h-96 w-80 overflow-hidden rounded-lg border-2 border-dashed shadow-lg"
				>
					<img
						src="/portfolio/IMG_0318.jpg"
						alt="Rama Herbin in Chicago"
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				</div>
			</div>
		</div>
	</div>
</section>
