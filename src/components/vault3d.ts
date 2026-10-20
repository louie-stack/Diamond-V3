import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The bag, in 3D: 100 cut diamonds in a 10 x 10 case. A lime laser sheet rides
 * the curve's level; everything under it is free (lit, lifted, turning), everything
 * above it is still locked in smoked glass. Day 100 the sheet dissolves and the
 * whole bag lifts. Curve.tsx calls set() whenever the day changes; this owns its
 * own render loop and only spends frames while the case is on screen.
 */

const N = 10;
const SP = 1.12; // centre to centre
const HALF = ((N - 1) * SP) / 2;
const LIME = new THREE.Color("#ccff00");

/** a brilliant cut, turned on a lathe: table, crown, girdle, pavilion, culet. Flat shading makes the facets. */
function gemGeometry() {
  const pts = [
    new THREE.Vector2(0, -0.92),
    new THREE.Vector2(0.98, -0.02),
    new THREE.Vector2(1, 0.04),
    new THREE.Vector2(0.64, 0.36),
    new THREE.Vector2(0.001, 0.36),
  ];
  const g = new THREE.LatheGeometry(pts, 8);
  // stood up in profile, the way the mark draws one: wide crown, pointed base
  g.translate(0, 0.28, 0);
  g.scale(0.5, 0.5, 0.5);
  return g.toNonIndexed();
}

/** a soft round glow, drawn once, for the flashes and the halo behind the case */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type Vault = { set: (p: number, final: boolean, down: boolean, live: boolean) => void; dispose: () => void };

export function createVault(host: HTMLElement): Vault | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.className = "vx__gl";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, -2.2, 26);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight("#ffffff", 1.4);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.PointLight("#b8ff3a", 0, 40, 1.6);
  rim.position.set(0, -6, 6);
  scene.add(rim);

  const rig = new THREE.Group(); // the case: tilts with the pointer
  rig.rotation.x = -0.16;
  scene.add(rig);

  const geo = gemGeometry();
  const freeMat = new THREE.MeshStandardMaterial({ color: "#c4ee00", emissive: "#4f6e00", emissiveIntensity: 0.4, roughness: 0.06, metalness: 0.05, flatShading: true, envMapIntensity: 1.7 });
  const lockMat = new THREE.MeshStandardMaterial({ color: "#252c1f", emissive: "#000000", roughness: 0.28, metalness: 0.6, flatShading: true, envMapIntensity: 0.55 });
  const free = new THREE.InstancedMesh(geo, freeMat, N * N);
  const locked = new THREE.InstancedMesh(geo, lockMat, N * N);
  free.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  locked.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rig.add(locked, free);

  // the floor of the case: faint cells under each stone
  const cells = new THREE.InstancedMesh(new THREE.PlaneGeometry(SP * 0.9, SP * 0.9), new THREE.MeshBasicMaterial({ color: "#ecE6d6", transparent: true, opacity: 0.025, depthWrite: false }), N * N);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < N * N; i++) {
    const { x, y } = cellXY(i);
    m4.makeTranslation(x, y, -0.5);
    cells.setMatrixAt(i, m4);
  }
  rig.add(cells);

  // the laser sheet at the level, and its glow
  const glowTex = glowTexture();
  const laser = new THREE.Mesh(new THREE.PlaneGeometry(N * SP + 1.4, 0.035), new THREE.MeshBasicMaterial({ color: "#f2ffc0", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(N * SP + 3, 1.6), new THREE.MeshBasicMaterial({ map: glowTex, color: LIME, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  laser.position.z = sheet.position.z = 0.9;
  rig.add(sheet, laser);
  // the halo behind the free stones, growing with them
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.z = -1.5;
  rig.add(halo);
  // flashes for the newest stones
  const flashes = Array.from({ length: 8 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: "#f4ffd0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    rig.add(s);
    return { s, age: 9 };
  });
  let nextFlash = 0;

  function cellXY(i: number) {
    // fill from the bottom row up, left to right: stone i frees on day i + 1
    const row = Math.floor(i / N), col = i % N;
    return { x: col * SP - HALF, y: row * SP - HALF };
  }

  /* ---- state from the reel, eased in the loop ---- */
  let target = 0.01, level = 0.01, isFinal = false, isDown = false, finalT = 0;
  const born = new Float32Array(N * N).fill(-9); // when each stone was freed, for its pop
  let prevP = 0;
  const clock = new THREE.Clock();

  const set = (p: number, final: boolean, down: boolean, live: boolean) => {
    const now = clock.getElapsedTime();
    if (live && !down && p > prevP) {
      for (let i = prevP; i < p && i < N * N; i++) {
        born[i] = now;
        const f = flashes[nextFlash++ % flashes.length];
        const { x, y } = cellXY(i);
        f.s.position.set(x, y, 1.2);
        f.age = 0;
      }
    }
    if (p < prevP || !live) for (let i = p; i < N * N; i++) born[i] = -9;
    prevP = p;
    target = p / 100;
    if (final && !isFinal) finalT = now;
    isFinal = final;
    isDown = down;
  };

  /* ---- size, pointer, visibility ---- */
  let w = 0, h = 0;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole case in frame whatever the shape
    const fit = (N * SP + 2.6) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(fit, fit / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let tx = 0, ty = 0, px = 0, py = 0;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const onOut = () => { tx = 0; ty = 0; };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onOut);

  let raf = 0, visible = false;
  const q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const loop = () => {
    raf = 0;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    level += (target - level) * Math.min(1, dt * (isDown ? 14 : 9));
    const sinceFinal = isFinal ? t - finalT : 0;
    const lift = isFinal ? Math.min(1, sinceFinal / 0.9) : 0;

    // the case leans toward the pointer and breathes a little on its own
    px += (tx - px) * Math.min(1, dt * 3);
    py += (ty - py) * Math.min(1, dt * 3);
    rig.rotation.y = px * 0.22 + Math.sin(t * 0.35) * 0.04 + (isFinal ? Math.sin(sinceFinal * 0.5) * 0.12 * lift : 0);
    rig.rotation.x = -0.16 + py * 0.14 + Math.cos(t * 0.27) * 0.025;

    for (let i = 0; i < N * N; i++) {
      const { x, y } = cellXY(i);
      const on = i < Math.round(target * N * N);
      const ph = i * 1.7;
      if (on) {
        const age = t - born[i];
        const pop = age >= 0 && age < 0.6 ? Math.sin((age / 0.6) * Math.PI) * 0.45 : 0;
        const spin = t * (0.7 + (i % 7) * 0.06) * (1 + lift * 1.2) + ph;
        e.set(0.18 + Math.sin(t * 0.9 + ph) * 0.08, spin, Math.cos(t * 0.7 + ph) * 0.06);
        q.setFromEuler(e);
        pos.set(x, y + Math.sin(t * 1.4 + ph) * 0.05 + lift * 0.12, 0.55 + pop * 1.4 + lift * (0.7 + Math.sin(t + ph) * 0.25));
        const s = 1 + pop * 0.6 + lift * 0.08;
        scl.set(s, s, s);
        m4.compose(pos, q, scl);
        free.setMatrixAt(i, m4);
        locked.setMatrixAt(i, m4.makeScale(0, 0, 0));
      } else {
        e.set(0.22, ph * 0.37, 0);
        q.setFromEuler(e);
        pos.set(x, y, 0);
        scl.set(0.9, 0.9, 0.9);
        m4.compose(pos, q, scl);
        locked.setMatrixAt(i, m4);
        free.setMatrixAt(i, m4.makeScale(0, 0, 0));
      }
    }
    free.instanceMatrix.needsUpdate = true;
    locked.instanceMatrix.needsUpdate = true;

    // the laser rides the level; at Day 100 it burns off the top
    const ly = -HALF - SP / 2 + level * N * SP;
    laser.position.y = sheet.position.y = ly;
    const lv = isFinal ? Math.max(0, 1 - sinceFinal / 0.6) : 1;
    (laser.material as THREE.MeshBasicMaterial).opacity = lv * (0.85 + Math.sin(t * 30) * 0.15);
    (sheet.material as THREE.MeshBasicMaterial).opacity = lv * 0.5;
    sheet.scale.y = 1 + lift * 3;

    halo.position.y = -HALF + (level * N * SP) / 2 - SP / 2;
    halo.scale.set(N * SP * 1.5, Math.max(1, level * N * SP * 1.3), 1);
    (halo.material as THREE.SpriteMaterial).opacity = 0.08 + level * 0.22 + lift * 0.25;
    rim.intensity = 3 + level * 18 + lift * 22;
    freeMat.emissiveIntensity = 0.38 + lift * 0.3 + Math.sin(t * 2) * 0.04;

    for (const f of flashes) {
      f.age += dt;
      const k = f.age / 0.5;
      const m = f.s.material as THREE.SpriteMaterial;
      m.opacity = k < 1 ? (1 - k) * 0.9 : 0;
      const s = 0.6 + k * 2.6;
      f.s.scale.set(s, s, 1);
    }

    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(loop); }
  }, { threshold: 0.05 });
  io.observe(host);

  return {
    set,
    dispose: () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onOut);
      geo.dispose(); freeMat.dispose(); lockMat.dispose(); glowTex.dispose(); env.dispose(); pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
