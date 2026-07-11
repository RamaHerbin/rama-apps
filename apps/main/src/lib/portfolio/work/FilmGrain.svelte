<script lang="ts">
	// Fixed, non-interactive fractal-noise texture overlay. Generic SVG turbulence
	// (feTurbulence), inlined as a data URI — no external asset, CSP-safe.
	const grain =
		"url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.7%22/%3E%3C/svg%3E')";
</script>

<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 z-[80] opacity-5"
	style="background-image: {grain};"
></div>
