<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { validateContactForm, hasValidationErrors, sanitizeFormData } from "./validation.js";
	import type { ContactFormData, FieldErrors } from "./types.js";

	let formState = $state<ContactFormData>({ name: "", email: "", message: "" });
	let fieldErrors = $state<FieldErrors>({});
	let isSubmitting = $state(false);
	let success = $state(false);
	let globalError = $state("");

	// Textarea gradient mouse tracking
	let textareaContainerRef: HTMLDivElement | undefined = $state();
	let textareaMouse = $state({ x: 0, y: 0 });
	let textareaVisible = $state(false);
	const textareaRadius = 100;

	// The halo is a hover affordance, so it must follow a repainted palette — but it
	// cannot ride --ring: that token is a pure neutral grey in BOTH standard themes
	// (oklch(0.708 0 0) light, oklch(0.439 0 0) dark), so pointing at it turned the
	// blue spotlight into a grey wash that is invisible over bg-muted at oklch(0.97).
	// --field-halo is therefore defined only under html[data-skin] (see skins.css);
	// unskinned, the fallback chain leaves standard byte-identical to before.
	let textareaBg = $derived(
		`radial-gradient(${textareaVisible ? textareaRadius + "px" : "0px"} circle at ${textareaMouse.x}px ${textareaMouse.y}px, var(--field-halo, var(--color-blue-500, #3b82f6)), transparent 80%)`
	);

	function handleTextareaMouseMove(e: MouseEvent) {
		if (!textareaContainerRef) return;
		const { left, top } = textareaContainerRef.getBoundingClientRect();
		textareaMouse = { x: e.clientX - left, y: e.clientY - top };
	}

	function dismissSuccess() {
		success = false;
	}

	function dismissError() {
		globalError = "";
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		fieldErrors = validateContactForm(formState);

		if (hasValidationErrors(fieldErrors)) return;

		isSubmitting = true;
		const sanitized = sanitizeFormData(formState);

		// Frontend-only: open mailto
		const subject = encodeURIComponent(`Portfolio Contact from ${sanitized.name}`);
		const body = encodeURIComponent(
			`Name: ${sanitized.name}\nEmail: ${sanitized.email}\n\nMessage:\n${sanitized.message}`
		);
		window.location.href = `mailto:rama.herbin@gmail.com?subject=${subject}&body=${body}`;

		setTimeout(() => {
			isSubmitting = false;
		}, 500);
		success = true;
		formState = { name: "", email: "", message: "" };

		setTimeout(() => {
			success = false;
		}, 5000);
	}
</script>

<div class="mx-auto w-full max-w-md">
	<!-- Global Success/Error Messages -->
	{#if success}
		<div class="mb-6">
			<!-- There is no --success token in this app's palette, so the green stays literal.
			     The panel surface is translucent instead of an opaque green-50/green-900 pair:
			     one value reads correctly over any page colour (white, near-black, cream) and
			     never punches an opaque light-grey hole into a repainted background. -->
			<div
				class="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-4"
			>
				<div class="flex items-center">
					<svg
						class="mr-3 h-5 w-5 text-green-600 dark:text-green-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<p class="text-sm font-medium text-green-800 dark:text-green-200">
						Message sent successfully! I'll get back to you soon.
					</p>
				</div>
				<button
					onclick={dismissSuccess}
					class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
					aria-label="Dismiss success message"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	{#if globalError}
		<div class="mb-6">
			<!-- Surface, border and the red-600-grade foregrounds all ride --destructive, so the
			     whole panel follows the palette. The dark-mode reds stay literal — see below. -->
			<div
				class="border-destructive/30 bg-destructive/10 flex items-center justify-between rounded-lg border p-4"
			>
				<div class="flex items-center">
					<svg
						class="text-destructive mr-3 h-5 w-5 dark:text-red-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<!-- Why every red here is `token dark:literal` rather than just the token:
					     --destructive is red-600 in light mode (oklch(0.577 0.245 27.325), the
					     exact Tailwind value — 4.83:1 on the light background, AA-clean) but
					     red-900 in dark mode (oklch(0.396 0.141 25.723) — 1.97:1 on #0a0a0a,
					     a background-grade red that is unreadable as text). So the token carries
					     light + both skins, where it is also the only way a repainted palette can
					     ever reach this copy, and the dark literal covers the one case it cannot.
					     The darker/lighter tints below (red-800/red-200) have no token at all. -->
					<p class="text-sm font-medium text-red-800 dark:text-red-200">{globalError}</p>
				</div>
				<button
					onclick={dismissError}
					class="text-destructive hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
					aria-label="Dismiss error message"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Contact Form -->
	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- Name Field -->
		<div>
			<label for="name" class="text-foreground mb-2 block text-sm font-medium">
				Name *
			</label>
			<!-- All three fields share this class string. Two of its classes look like dead
			     leftovers and are not: in Tailwind v4 `shadow-input` is the shadow-COLOR utility
			     (`--tw-shadow-color: var(--input)`, no size, so nothing paints on its own), and
			     `dark:shadow-[…]` compiles to `var(--tw-shadow-color, var(--neutral-700))` — the
			     fallback is never reached because `shadow-input` supplies the colour. Together
			     they are the 1px hairline the fields carry in dark mode, already riding --input.
			     Delete either one and the hairline disappears. -->
			<input
				id="name"
				type="text"
				bind:value={formState.name}
				placeholder="Your full name"
				disabled={isSubmitting}
				class={cn(
					"shadow-input bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border-none px-3 py-2 text-sm transition duration-400 focus-visible:ring-[2px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)]",
					fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""
				)}
				aria-describedby="name-error"
				required
			/>
			{#if fieldErrors.name}
				<!-- `text-destructive dark:text-red-400`, same split as the global error panel:
				     the token is red-900 in dark mode and would be unreadable there. -->
				<p id="name-error" class="text-destructive mt-1 text-sm dark:text-red-400">
					{fieldErrors.name}
				</p>
			{/if}
		</div>

		<!-- Email Field -->
		<div>
			<label for="email" class="text-foreground mb-2 block text-sm font-medium">
				Email *
			</label>
			<input
				id="email"
				type="email"
				bind:value={formState.email}
				placeholder="your.email@example.com"
				disabled={isSubmitting}
				class={cn(
					"shadow-input bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border-none px-3 py-2 text-sm transition duration-400 focus-visible:ring-[2px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)]",
					fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""
				)}
				aria-describedby="email-error"
				required
			/>
			{#if fieldErrors.email}
				<p id="email-error" class="text-destructive mt-1 text-sm dark:text-red-400">
					{fieldErrors.email}
				</p>
			{/if}
		</div>

		<!-- Message Field -->
		<div>
			<label for="message" class="text-foreground mb-2 block text-sm font-medium">
				Message *
			</label>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={textareaContainerRef}
				class="group/input rounded-lg p-[2px] transition duration-300"
				style:background={textareaBg}
				onmouseenter={() => (textareaVisible = true)}
				onmouseleave={() => (textareaVisible = false)}
				onmousemove={handleTextareaMouseMove}
			>
				<textarea
					id="message"
					bind:value={formState.message}
					rows="4"
					placeholder="Tell me about your project or just say hello..."
					disabled={isSubmitting}
					class={cn(
						"shadow-input bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full resize-none rounded-md border-none px-3 py-2 text-sm transition duration-400 group-hover/input:shadow-none focus-visible:ring-[2px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)]",
						fieldErrors.message ? "border-destructive focus-visible:ring-destructive" : ""
					)}
					aria-describedby="message-error"
					required
				></textarea>
			</div>
			{#if fieldErrors.message}
				<p id="message-error" class="text-destructive mt-1 text-sm dark:text-red-400">
					{fieldErrors.message}
				</p>
			{/if}
		</div>

		<!-- Submit Button -->
		<button
			type="submit"
			disabled={isSubmitting}
			class="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring focus:ring-offset-background flex w-full items-center justify-center rounded-lg px-4 py-2 font-medium transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			aria-label={isSubmitting ? "Sending message..." : "Send message"}
		>
			{#if isSubmitting}
				<svg
					class="text-primary-foreground mr-3 -ml-1 h-5 w-5 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{/if}
			{isSubmitting ? "Sending..." : "Send Message"}
		</button>
	</form>
</div>
