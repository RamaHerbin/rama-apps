/**
 * test-lake — a pointillist "fever dream" scene in the spirit of
 * lysterfieldlake.com (Charlie Gleason / Brightly), rebuilt from scratch
 * around one of our own photos. No assets or code from the original.
 *
 * The trick chain:
 *  - the photo becomes a grid of GL points, displaced along Z by a cheap
 *    depth guess (vertical gradient + luminance detail — no ML at runtime);
 *  - the camera drifts with the pointer (or touch drag) for parallax;
 *  - moving fast makes the near points — the "subject" — scatter and
 *    dissolve, holding still lets them settle back (the original hides its
 *    protagonist the same way);
 *  - a watercolor gradient sky sits behind, and a post pass adds film
 *    grain, chromatic aberration and a vignette;
 *  - colors are posterized through a Bayer dither for the printed-ink look.
 */

import * as THREE from "three";

export interface LakeScene {
  /** 0 = calm (no wobble, gentle post), 1 = dream (full wobble + heavier CA). */
  setDream(on: boolean): void;
  destroy(): void;
}

interface LakeOptions {
  photoUrl: string;
  /** Respect prefers-reduced-motion: static camera, no wobble, no scatter. */
  reducedMotion: boolean;
}

const POINTS_VERT = /* glsl */ `
	uniform sampler2D uPhoto;
	uniform float uTime;
	uniform float uRelief;
	uniform float uWobble;
	uniform float uPresence;
	uniform float uPointScale;
	attribute vec3 aRand; // per-point hash: scatter direction + phase
	varying vec2 vUv;
	varying float vDepth;
	varying float vFade;

	float luma(vec3 c) {
		return dot(c, vec3(0.299, 0.587, 0.114));
	}

	void main() {
		vUv = uv;
		vec3 photo = texture2D(uPhoto, uv).rgb;

		// Cheap depth guess, 1 = near. Bottom of the frame is assumed close
		// (works for a grounded subject), luminance adds micro-relief so
		// buildings and figures pop off the sky.
		float depth = mix(1.0 - uv.y, 1.0 - luma(photo), 0.22);
		vDepth = depth;

		vec3 pos = position;
		pos.z += depth * uRelief;

		// Fever-dream wobble: every point breathes on its own phase.
		float phase = aRand.x * 6.2831 + uTime * (0.6 + aRand.y * 0.5);
		pos.x += sin(phase) * 0.012 * uWobble;
		pos.y += cos(phase * 0.9) * 0.012 * uWobble;
		pos.z += sin(uTime * 0.4 + aRand.z * 6.2831) * 0.03 * uWobble;

		// The subject hides: near points scatter outward and fade as
		// presence drops (pointer velocity drives presence from JS).
		float nearMask = smoothstep(0.55, 0.8, depth);
		float away = (1.0 - uPresence) * nearMask;
		pos += normalize(aRand - 0.5) * away * 0.7;
		vFade = 1.0 - away;

		vec4 mv = modelViewMatrix * vec4(pos, 1.0);
		gl_Position = projectionMatrix * mv;
		gl_PointSize = clamp(uPointScale * (0.7 + 0.5 * depth) / -mv.z, 1.0, 7.0);
	}
`;

const POINTS_FRAG = /* glsl */ `
	precision highp float;
	uniform sampler2D uPhoto;
	uniform vec3 uFogColor;
	varying vec2 vUv;
	varying float vDepth;
	varying float vFade;

	// 4x4 Bayer matrix — posterize + dither = printed-ink watercolor.
	float bayer4(vec2 p) {
		vec2 q = floor(mod(p, 4.0));
		float i = q.x + q.y * 4.0;
		// Classic index table flattened into arithmetic.
		float b = mod(i * 9.0 + floor(i / 4.0) * 5.0, 16.0);
		return (b + 0.5) / 16.0;
	}

	void main() {
		// Round sprite.
		vec2 c = gl_PointCoord - 0.5;
		if (dot(c, c) > 0.25) discard;

		vec3 color = texture2D(uPhoto, vUv).rgb;

		// Watercolor lift: open the shadows and push saturation so the wash
		// stays luminous instead of muddy.
		color = pow(color, vec3(0.8));
		float l = dot(color, vec3(0.299, 0.587, 0.114));
		color = clamp(mix(vec3(l), color, 1.3) * 1.08, 0.0, 1.0);

		// Ink dither: 7 levels per channel nudged by the Bayer threshold.
		float d = (bayer4(gl_FragCoord.xy) - 0.5) * 0.7;
		color = floor(color * 7.0 + 0.5 + d) / 7.0;

		// Far points sink into the sky wash.
		color = mix(uFogColor, color, smoothstep(-0.15, 0.35, vDepth));

		float alpha = vFade * (0.82 + 0.18 * smoothstep(0.5, 0.9, vFade));
		if (alpha < 0.03) discard;
		gl_FragColor = vec4(color, alpha);
	}
`;

const SKY_FRAG = /* glsl */ `
	precision highp float;
	uniform float uTime;
	varying vec2 vUv;

	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
	}

	void main() {
		// Dusk-lake wash: deep teal below, peach horizon, lavender above.
		vec3 top = vec3(0.42, 0.47, 0.72);
		vec3 mid = vec3(0.96, 0.76, 0.58);
		vec3 bottom = vec3(0.10, 0.29, 0.30);

		float y = vUv.y + sin(uTime * 0.15 + vUv.x * 3.0) * 0.015;
		vec3 color = mix(bottom, mid, smoothstep(0.05, 0.42, y));
		color = mix(color, top, smoothstep(0.45, 0.95, y));

		// Soft sun sitting on the horizon line.
		float sun = distance(vUv, vec2(0.62, 0.44));
		color += vec3(1.0, 0.85, 0.6) * smoothstep(0.28, 0.0, sun) * 0.35;

		// Paper texture so the wash never reads flat.
		color += (hash(vUv * 700.0) - 0.5) * 0.03;
		gl_FragColor = vec4(color, 1.0);
	}
`;

const POST_FRAG = /* glsl */ `
	precision highp float;
	uniform sampler2D tScene;
	uniform float uTime;
	uniform float uCA;
	varying vec2 vUv;

	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
	}

	void main() {
		// Chromatic aberration, growing toward the edges.
		vec2 toCenter = vUv - 0.5;
		float r2 = dot(toCenter, toCenter);
		vec2 shift = toCenter * r2 * uCA;
		vec3 color = vec3(
			texture2D(tScene, vUv + shift).r,
			texture2D(tScene, vUv).g,
			texture2D(tScene, vUv - shift).b
		);

		// Film grain, re-seeded every frame.
		color += (hash(vUv * 900.0 + fract(uTime) * 43.0) - 0.5) * 0.055;

		// Vignette.
		color *= 1.0 - smoothstep(0.35, 0.95, sqrt(r2)) * 0.45;

		gl_FragColor = vec4(color, 1.0);
	}
`;

const FULLSCREEN_VERT = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

export async function createLakeScene(
  canvas: HTMLCanvasElement,
  { photoUrl, reducedMotion }: LakeOptions,
): Promise<LakeScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const texture = await new THREE.TextureLoader().loadAsync(photoUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    40,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    20,
  );
  camera.position.set(0, 0, 2.6);

  // --- Watercolor sky, pinned behind everything ---
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: SKY_FRAG,
    depthWrite: false,
    depthTest: false,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  // --- The photo as a grid of points ---
  const image = texture.image as { width: number; height: number };
  const aspect = image.width / image.height;
  const rows = 400;
  const cols = Math.round(rows * aspect);
  const planeHeight = 2.6;
  const planeWidth = planeHeight * aspect;

  const count = rows * cols;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const rand = new Float32Array(count * 3);
  let i3 = 0;
  let i2 = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const u = x / (cols - 1);
      const v = y / (rows - 1);
      positions[i3] = (u - 0.5) * planeWidth;
      positions[i3 + 1] = (v - 0.5) * planeHeight;
      positions[i3 + 2] = 0;
      rand[i3] = Math.random();
      rand[i3 + 1] = Math.random();
      rand[i3 + 2] = Math.random();
      uvs[i2] = u;
      uvs[i2 + 1] = v;
      i3 += 3;
      i2 += 2;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));

  const pointsUniforms = {
    uPhoto: { value: texture },
    uTime: { value: 0 },
    uRelief: { value: 0.85 },
    uWobble: { value: reducedMotion ? 0 : 1 },
    uPresence: { value: 1 },
    uPointScale: { value: 5.6 * dpr },
    uFogColor: { value: new THREE.Color(0.55, 0.55, 0.68) },
  };
  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: pointsUniforms,
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  // Recenter so the near (bottom) edge doesn't crop out when relief pushes it.
  points.position.z = -0.45;
  scene.add(points);

  // --- Post pass: scene -> render target -> grain/CA/vignette quad ---
  const target = new THREE.WebGLRenderTarget(
    Math.round(canvas.clientWidth * dpr),
    Math.round(canvas.clientHeight * dpr),
  );
  const postUniforms = {
    tScene: { value: target.texture },
    uTime: { value: 0 },
    uCA: { value: 0.09 },
  };
  const postMaterial = new THREE.ShaderMaterial({
    uniforms: postUniforms,
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: POST_FRAG,
    depthWrite: false,
    depthTest: false,
  });
  const postScene = new THREE.Scene();
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // --- Interaction: parallax target + presence from pointer velocity ---
  let targetX = 0;
  let targetY = 0;
  let energy = 0;
  let presence = 1;
  let lastPointer: { x: number; y: number; t: number } | null = null;

  function onPointerMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetX = nx;
    targetY = ny;
    const now = performance.now();
    if (lastPointer) {
      const dt = Math.max(now - lastPointer.t, 1);
      const dist = Math.hypot(
        e.clientX - lastPointer.x,
        e.clientY - lastPointer.y,
      );
      // px/ms → energy; fast sweeps push it past 1 quickly.
      energy = Math.min(energy + (dist / dt) * 0.14, 1.6);
    }
    lastPointer = { x: e.clientX, y: e.clientY, t: now };
  }

  // Gyro parallax where it works without a permission dance (Android).
  function onOrientation(e: DeviceOrientationEvent) {
    if (e.gamma == null || e.beta == null) return;
    targetX = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
    targetY = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
  }

  if (!reducedMotion) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("deviceorientation", onOrientation);
  }

  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    target.setSize(Math.round(w * dpr), Math.round(h * dpr));
  }
  window.addEventListener("resize", onResize);

  // --- Frame loop ---
  let raf = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    // Energy decays, presence chases its complement — hold still and
    // the subject re-forms, sweep around and it dissolves.
    energy = Math.max(energy - 0.012, 0);
    const wanted = 1 - Math.min(energy, 1);
    presence += (wanted - presence) * 0.05;

    camera.position.x += (targetX * 0.22 - camera.position.x) * 0.04;
    camera.position.y += (-targetY * 0.16 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -0.2);

    pointsUniforms.uTime.value = t;
    pointsUniforms.uPresence.value = reducedMotion ? 1 : presence;
    skyMaterial.uniforms.uTime.value = t;
    postUniforms.uTime.value = t;

    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  }
  frame();

  return {
    setDream(on: boolean) {
      if (!reducedMotion) pointsUniforms.uWobble.value = on ? 1 : 0.15;
      postUniforms.uCA.value = on ? 0.09 : 0.03;
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      pointsMaterial.dispose();
      skyMaterial.dispose();
      postMaterial.dispose();
      postQuad.geometry.dispose();
      sky.geometry.dispose();
      texture.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}
