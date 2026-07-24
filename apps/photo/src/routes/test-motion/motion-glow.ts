/**
 * Port of Maxime Heckel's "motion-tracking-2" demo
 * (https://r3f.maximeheckel.com/motion-tracking-2) from R3F to vanilla
 * Three.js WebGPURenderer + TSL, driven from a Svelte onMount.
 *
 * Pipeline: river footage → WGSL compute pass doing frame-differencing motion
 * detection at quarter resolution (ping-pong storage textures, decaying trail
 * accumulation, footage-specific "water" colour mask) → full-screen output
 * pass rendering the trails as an ASCII glyph grid tinted with an HDR neon
 * colour over the darkened posterised footage → UnrealBloom for the glow.
 */
import {
	CanvasTexture,
	ClampToEdgeWrapping,
	LinearFilter,
	NearestFilter,
	NeutralToneMapping,
	RenderPipeline,
	SRGBColorSpace,
	StorageTexture,
	Vector3,
	VideoTexture,
	WebGPURenderer
} from "three/webgpu";
import {
	Fn,
	If,
	dot,
	float,
	instanceIndex,
	mix,
	texture,
	textureStore,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
	wgslFn
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

const VIDEO_URL = "https://cdn.maximeheckel.com/videos/footages/river4-compressed.mp4";

const ASCII_CHARS = " .,:-=+*%#$";
const ATLAS_CELL = 512;
const GRID_ROWS = 96;
const DETECTION_SCALE = 0.25;

// HDR neon palettes (components > 1 feed the bloom pass); pow(2.2) is applied
// JS-side when the uniform is set, matching the demo's pow(vec3, 2.2) nodes.
const NEON: Record<string, [number, number, number]> = {
	blue: [0.0235, 0.5137, 1.1],
	red: [1.1, 0.08, 0.0235],
	green: [0.0235, 1.1, 0.35]
};

export type NeonColor = keyof typeof NEON;

export interface MotionGlow {
	setColor(color: NeonColor): void;
	setDebug(show: boolean): void;
	destroy(): void;
}

const COMPUTE_MOTION_WGSL = /* wgsl */ `
	fn computeMotion(
		sceneTexture: texture_2d<f32>,
		previousFrameReadTexture: texture_2d<f32>,
		previousFrameWriteTexture: texture_storage_2d<rgba8unorm, write>,
		trailReadTexture: texture_2d<f32>,
		trailWriteTexture: texture_storage_2d<rgba8unorm, write>,
		hasPreviousFrame: bool,
		motionThreshold: f32,
		trailDecay: f32,
		videoUvScale: vec2f,
		index: u32
	) -> void {
		let detectionDimensions = textureDimensions(previousFrameWriteTexture);
		let pixelCount = detectionDimensions.x * detectionDimensions.y;

		if (index >= pixelCount) {
			return;
		}

		let coord = vec2u(index % detectionDimensions.x, index / detectionDimensions.x);
		let sceneDimensions = textureDimensions(sceneTexture);
		let outputUv = (vec2f(coord) + vec2f(0.5)) / vec2f(detectionDimensions);
		let coverUv = (outputUv - vec2f(0.5)) * videoUvScale + vec2f(0.5);
		let sceneUv = vec2f(coverUv.x, 1.0 - coverUv.y);
		let sceneCoord = clamp(
			vec2i(sceneUv * vec2f(sceneDimensions)),
			vec2i(0),
			vec2i(sceneDimensions) - vec2i(1)
		);
		let sceneColor = textureLoad(sceneTexture, sceneCoord, 0).rgb;
		let currentGray = dot(sceneColor, vec3f(0.299, 0.587, 0.114));

		// Footage-specific mask keeping the effect on the (neutral, lit,
		// non-vegetation) water surface only.
		let maxChannel = max(sceneColor.r, max(sceneColor.g, sceneColor.b));
		let minChannel = min(sceneColor.r, min(sceneColor.g, sceneColor.b));
		let saturation = (maxChannel - minChannel) / max(maxChannel, 0.0001);
		let neutralColorMask = 1.0 - smoothstep(0.125, 0.13, saturation);
		let luminanceMask = smoothstep(0.02, 0.2, currentGray);
		let greenExcess = sceneColor.g - max(sceneColor.r, sceneColor.b);
		let nonGreenMask = 1.0 - smoothstep(0.02, 0.12, greenExcess);
		let waterColorMask = neutralColorMask * luminanceMask * nonGreenMask;

		let currentValue = currentGray;
		let previousValue = textureLoad(previousFrameReadTexture, vec2i(coord), 0).r;
		let difference = abs(currentValue - previousValue);

		var motionAmount = 0.0;
		if (hasPreviousFrame) {
			let thresholdedMotion = smoothstep(
				motionThreshold,
				motionThreshold * 4.0,
				difference
			);
			motionAmount = pow(thresholdedMotion, 0.5) * waterColorMask;
		}

		let previousTrailAmount = textureLoad(trailReadTexture, vec2i(coord), 0).r;
		let decayedTrailAmount = max(previousTrailAmount * trailDecay - 0.025, 0.0);
		let trailAmount = max(decayedTrailAmount, motionAmount) * waterColorMask;

		textureStore(trailWriteTexture, vec2i(coord), vec4f(vec3f(trailAmount), trailAmount));
		textureStore(previousFrameWriteTexture, vec2i(coord), vec4f(vec3f(currentValue), 1.0));
	}
`;

function createAsciiAtlas(): CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = ATLAS_CELL * ASCII_CHARS.length;
	canvas.height = ATLAS_CELL;
	const ctx = canvas.getContext("2d")!;
	ctx.imageSmoothingEnabled = true;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";
	ctx.font = `${ATLAS_CELL}px "Space Grotesk", "MS Gothic", "Noto Sans JP", monospace`;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ASCII_CHARS.split("").forEach((char, i) => {
		ctx.fillText(char, (i + 0.5) * ATLAS_CELL, ATLAS_CELL / 2);
	});

	const tex = new CanvasTexture(canvas);
	tex.generateMipmaps = false;
	tex.magFilter = LinearFilter;
	tex.minFilter = LinearFilter;
	tex.wrapS = ClampToEdgeWrapping;
	tex.wrapT = ClampToEdgeWrapping;
	tex.needsUpdate = true;
	return tex;
}

function createDetectionTexture(width: number, height: number): StorageTexture {
	const tex = new StorageTexture(width, height);
	tex.magFilter = NearestFilter;
	tex.minFilter = NearestFilter;
	return tex;
}

function createVideo(): Promise<HTMLVideoElement> {
	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		video.crossOrigin = "anonymous";
		video.muted = true;
		video.loop = true;
		video.playsInline = true;
		video.preload = "auto";
		video.addEventListener("loadedmetadata", () => resolve(video), { once: true });
		video.addEventListener("error", () => reject(new Error("Failed to load footage")), {
			once: true
		});
		video.src = VIDEO_URL;
	});
}

export async function createMotionGlow(canvas: HTMLCanvasElement): Promise<MotionGlow> {
	if (!("gpu" in navigator)) {
		throw new Error("WebGPU is not supported in this browser");
	}

	const video = await createVideo();
	void video.play();

	const renderer = new WebGPURenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
	renderer.toneMapping = NeutralToneMapping;
	await renderer.init();

	// The WGSL compute pass only runs on the WebGPU backend; fail loudly rather
	// than rendering garbage if three silently fell back to WebGL.
	if (!(renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend) {
		renderer.dispose();
		throw new Error("WebGPU backend unavailable (renderer fell back to WebGL)");
	}

	const videoTexture = new VideoTexture(video);
	videoTexture.colorSpace = SRGBColorSpace;

	const uniforms = {
		hasPreviousFrame: uniform(false),
		motionThreshold: uniform(0.005),
		trailDecay: uniform(0.995),
		showDebug: uniform(false),
		effectColor: uniform(new Vector3())
	};

	const asciiAtlas = createAsciiAtlas();

	// Rebuilt on resize (sizes are baked into textures and WGSL constants).
	let detectionTextures: StorageTexture[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let computeNodes: any[] = [];
	let pipelines: RenderPipeline[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let bloomNodes: any[] = [];

	function disposePipeline() {
		for (const tex of detectionTextures) tex.dispose();
		for (const node of bloomNodes) node.dispose();
		for (const pipeline of pipelines) pipeline.dispose();
		detectionTextures = [];
		computeNodes = [];
		pipelines = [];
		bloomNodes = [];
	}

	function buildPipeline() {
		disposePipeline();

		const pixelRatio = renderer.getPixelRatio();
		const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
		const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
		const detectionWidth = Math.max(1, Math.floor(DETECTION_SCALE * width));
		const detectionHeight = Math.max(1, Math.floor(DETECTION_SCALE * height));

		// "Cover" fit of the video inside the canvas.
		const videoAspect = video.videoWidth / video.videoHeight || 16 / 9;
		const canvasAspect = width / height;
		const coverX = videoAspect > canvasAspect ? canvasAspect / videoAspect : 1;
		const coverY = videoAspect > canvasAspect ? 1 : videoAspect / canvasAspect;

		const previousFrames = [
			createDetectionTexture(detectionWidth, detectionHeight),
			createDetectionTexture(detectionWidth, detectionHeight)
		];
		const trails = [
			createDetectionTexture(detectionWidth, detectionHeight),
			createDetectionTexture(detectionWidth, detectionHeight)
		];
		detectionTextures = [...previousFrames, ...trails];

		const computeMotion = wgslFn(COMPUTE_MOTION_WGSL);
		const makeCompute = (read: number, write: number) =>
			computeMotion({
				sceneTexture: texture(videoTexture),
				previousFrameReadTexture: texture(previousFrames[read]),
				previousFrameWriteTexture: textureStore(previousFrames[write]).toWriteOnly(),
				trailReadTexture: texture(trails[read]),
				trailWriteTexture: textureStore(trails[write]).toWriteOnly(),
				hasPreviousFrame: uniforms.hasPreviousFrame,
				motionThreshold: uniforms.motionThreshold,
				trailDecay: uniforms.trailDecay,
				videoUvScale: vec2(coverX, coverY),
				index: instanceIndex
			}).compute(detectionWidth * detectionHeight, [8]);

		// computeNodes[i] writes into trails[writeIndex]; the matching output
		// pass below reads that freshly written texture.
		computeNodes = [makeCompute(0, 1), makeCompute(1, 0)];

		const gridCols = Math.max(1, Math.round(GRID_ROWS * canvasAspect));

		const snapPaneUv = wgslFn(`
			fn snapPaneUv(paneUv: vec2f) -> vec2f {
				let pixelGrid = vec2f(${gridCols}.0, ${GRID_ROWS}.0);
				return (floor(paneUv * pixelGrid) + vec2f(0.5)) / pixelGrid;
			}
		`);

		const asciiAtlasMotion = wgslFn(`
			fn asciiAtlasMotion(
				asciiTexture: texture_2d<f32>,
				paneUv: vec2f,
				value: f32
			) -> f32 {
				let cellUv = fract(paneUv * vec2f(${gridCols}.0, ${GRID_ROWS}.0));
				let luma = clamp(value, 0.0, 1.0);
				let charIndex = clamp(
					floor(luma * ${ASCII_CHARS.length - 1}.0),
					0.0,
					${ASCII_CHARS.length - 1}.0
				);
				let asciiUv = vec2f(
					(charIndex + cellUv.x) / ${ASCII_CHARS.length}.0,
					1.0 - cellUv.y
				);
				let asciiDimensions = textureDimensions(asciiTexture);
				let asciiCoord = clamp(
					vec2i(asciiUv * vec2f(asciiDimensions)),
					vec2i(0),
					vec2i(asciiDimensions) - vec2i(1)
				);
				return textureLoad(asciiTexture, asciiCoord, 0).r;
			}
		`);

		const makeOutput = (trailIndex: number) => {
			const trailTex = trails[trailIndex];
			const pass = Fn(() => {
				const paneUv = uv();
				const screenUv = uv();
				const scaledUv = screenUv.sub(0.5).mul(vec2(coverX, coverY)).add(0.5);
				const videoUv = vec2(scaledUv.x, float(1).sub(scaledUv.y));
				const videoColor = texture(videoTexture, videoUv).rgb;
				const rawTrail = texture(trailTex, screenUv).a;

				// Darkened, posterised footage as the base layer.
				const gray = dot(videoColor, vec3(0.299, 0.587, 0.114));
				const levels = float(8);
				const posterized = vec3(gray.mul(levels).add(0.5).floor().div(levels)).mul(0.04);
				const result = posterized.toVar();

				const snappedUv = snapPaneUv({ paneUv });
				const trailAmount = texture(trailTex, snappedUv).r;
				// wgslFn calls type as a generic Node; the WGSL returns f32.
				const glyphCoverage = asciiAtlasMotion({
					asciiTexture: texture(asciiAtlas),
					paneUv,
					value: trailAmount
				}) as unknown as ReturnType<typeof float>;
				const neonWithGlyphs = mix(uniforms.effectColor, vec3(1, 1, 1), glyphCoverage);

				If(uniforms.showDebug, () => {
					result.assign(vec3(rawTrail));
				}).Else(() => {
					result.assign(mix(posterized, vec3(neonWithGlyphs), trailAmount));
				});

				// Small saturation boost, keeping luminance.
				const boosted = mix(vec3(dot(result, vec3(0.2125, 0.7154, 0.0721))), result, 1.05);
				return vec4(boosted, 1);
			})();

			const bloomPass = bloom(pass, 0.75, 0.15, 0.19);
			bloomNodes.push(bloomPass);
			return pass.add(bloomPass);
		};

		// One prebuilt RenderPipeline per ping-pong side: reassigning a single
		// pipeline's outputNode every frame would rebuild its material each time.
		pipelines = [
			new RenderPipeline(renderer, makeOutput(1)),
			new RenderPipeline(renderer, makeOutput(0))
		];

		uniforms.hasPreviousFrame.value = false;
	}

	buildPipeline();

	let destroyed = false;
	let raf = 0;
	let current = 0;
	let hasPreviousFrame = false;

	function frame() {
		if (destroyed) return;
		raf = requestAnimationFrame(frame);
		uniforms.hasPreviousFrame.value = hasPreviousFrame;
		renderer.compute(computeNodes[current]);
		renderer.clear();
		pipelines[current].render();
		hasPreviousFrame = true;
		current = 1 - current;
	}
	raf = requestAnimationFrame(frame);

	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	function onResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			if (destroyed) return;
			renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
			hasPreviousFrame = false;
			current = 0;
			buildPipeline();
		}, 150);
	}
	window.addEventListener("resize", onResize);

	const api: MotionGlow = {
		setColor(color) {
			const [r, g, b] = NEON[color] ?? NEON.blue;
			uniforms.effectColor.value.set(r ** 2.2, g ** 2.2, b ** 2.2);
		},
		setDebug(show) {
			uniforms.showDebug.value = show;
		},
		destroy() {
			destroyed = true;
			cancelAnimationFrame(raf);
			clearTimeout(resizeTimer);
			window.removeEventListener("resize", onResize);
			disposePipeline();
			asciiAtlas.dispose();
			videoTexture.dispose();
			renderer.dispose();
			video.pause();
			video.removeAttribute("src");
			video.load();
		}
	};

	api.setColor("blue");
	return api;
}
