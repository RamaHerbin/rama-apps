/// <reference types="@webgpu/types" />
/**
 * Tiny WebGPU canvas that clears to a brighter-than-white color (clearValue
 * r=g=b=boost with extended tone mapping) — the visual proof next to a CSS
 * #fff swatch. On an HDR screen the two read as different whites; on an SDR
 * screen (or a browser that clamps) they look identical, which is exactly the
 * information the verdict is claiming.
 *
 * No pipeline, no shader: a single clear pass is the whole render.
 */

export async function startHdrSwatch(
	canvas: HTMLCanvasElement,
	boost = 4
): Promise<(() => void) | null> {
	try {
		const gpu = navigator.gpu;
		if (!gpu) return null;
		const adapter = await gpu.requestAdapter();
		if (!adapter) return null;
		const device = await adapter.requestDevice();

		// `toneMapping` and `colorSpace` are ignored by browsers that do not
		// support them yet (WebIDL drops unknown dictionary members), in which
		// case the swatch is clamped to SDR and simply matches the #fff one.
		const configuration = {
			device,
			format: 'rgba16float',
			alphaMode: 'opaque',
			colorSpace: 'display-p3',
			toneMapping: { mode: 'extended' }
		} as GPUCanvasConfiguration;

		// Probe the configuration on a detached canvas first: once a canvas has
		// vended a "webgpu" context it can never provide another kind, so we
		// must know configure() succeeds before claiming the visible element.
		try {
			const probe = document.createElement('canvas').getContext('webgpu');
			if (!probe) {
				device.destroy();
				return null;
			}
			probe.configure(configuration);
			probe.unconfigure();
		} catch (error) {
			device.destroy();
			if (import.meta.env.DEV) {
				console.warn('[hdr-swatch] WebGPU canvas configuration rejected:', error);
			}
			return null;
		}

		const context = canvas.getContext('webgpu');
		if (!context) {
			device.destroy();
			return null;
		}
		context.configure(configuration);

		let disposed = false;
		const draw = () => {
			if (disposed) return;
			try {
				const encoder = device.createCommandEncoder();
				const pass = encoder.beginRenderPass({
					colorAttachments: [
						{
							view: context.getCurrentTexture().createView(),
							clearValue: { r: boost, g: boost, b: boost, a: 1 },
							loadOp: 'clear',
							storeOp: 'store'
						}
					]
				});
				pass.end();
				device.queue.submit([encoder.finish()]);
			} catch (error) {
				// Device lost / canvas detached: stop instead of spamming.
				disposed = true;
				if (import.meta.env.DEV) {
					console.warn('[hdr-swatch] draw failed:', error);
				}
			}
		};

		draw();

		// The swap-chain texture is not retained, so anything that can discard
		// it needs one fresh clear pass. Fixed-size canvas → no reconfigure.
		const onVisibilityChange = () => {
			if (!document.hidden) draw();
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('resize', draw);

		return () => {
			disposed = true;
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('resize', draw);
			context.unconfigure();
			device.destroy();
		};
	} catch (error) {
		if (import.meta.env.DEV) {
			console.warn('[hdr-swatch] WebGPU unavailable:', error);
		}
		return null;
	}
}
