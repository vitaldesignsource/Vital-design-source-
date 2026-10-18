import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import geometry from "./crest-geometry.json";

export interface CrestScene {
  setActive: (active: boolean) => void;
  dispose: () => void;
}

/** A local studio environment: no external textures or requests are needed. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const background = context.createLinearGradient(0, 0, 0, 512);
  background.addColorStop(0, "#c6d4ce");
  background.addColorStop(0.42, "#35473f");
  background.addColorStop(0.52, "#101b15");
  background.addColorStop(0.72, "#263e32");
  background.addColorStop(1, "#65796e");
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 512);
  for (const [x, width, color] of [
    [100, 125, "#ffffff"],
    [480, 55, "#d7fff0"],
    [800, 60, "#f6fffc"],
  ] as const) {
    context.fillStyle = color;
    context.fillRect(x, 40, width, 240);
  }
  const source = new THREE.CanvasTexture(canvas);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(source);
  source.dispose();
  generator.dispose();
  return target;
}

export function createCrestScene(
  element: HTMLElement,
  initialActive: boolean,
): CrestScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const canvas = renderer.domElement;
  canvas.className = "crest-sculpture-canvas";
  canvas.setAttribute("aria-hidden", "true");
  element.append(canvas);

  const scene = new THREE.Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7.8);
  const crest = new THREE.Group();
  const face = new THREE.MeshStandardMaterial({
    color: 0xd9e4df,
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1.4,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: 0x7b9e8e,
    metalness: 0.9,
    roughness: 0.21,
    envMapIntensity: 1.4,
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}">${geometry.paths
    .map(
      (path) =>
        `<path d="${path.d}" transform="${path.transform}" fill="#fff"/>`,
    )
    .join("")}</svg>`;
  const paths = new SVGLoader().parse(svg).paths;
  const meshes: THREE.ExtrudeGeometry[] = [];
  for (const path of paths) {
    for (const shape of SVGLoader.createShapes(path)) {
      const meshGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: 35,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 4,
        bevelThickness: 5,
        curveSegments: 5,
      });
      const positions = meshGeometry.getAttribute("position");
      for (let vertex = 0; vertex < positions.count; vertex += 1) {
        const x = positions.getX(vertex) - 708;
        positions.setZ(vertex, positions.getZ(vertex) + (x * x) / 6500);
      }
      meshGeometry.computeVertexNormals();
      meshes.push(meshGeometry);
      crest.add(new THREE.Mesh(meshGeometry, [face, edge]));
    }
  }
  // The source is a Y-down vector. Center and normalize the complete identity.
  const box = new THREE.Box3().setFromObject(crest);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 3.95 / size.x;
  for (const child of crest.children) child.position.sub(center);
  crest.scale.set(scale, -scale, scale);
  crest.rotation.set(0.08, -0.22, -0.035);
  scene.add(crest);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x315743, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x82ffc2, 18, 15, 2);
  rim.position.set(3, -1, 3);
  scene.add(rim);

  let active = initialActive;
  element.dataset.motion = initialActive ? "running" : "paused";
  let contextLost = false;
  let visible = true;
  let disposed = false;
  let frame = 0;
  let lastFrame = -Infinity;
  let width = 0;
  let height = 0;
  let ready = false;
  const pointer = new THREE.Vector2();
  const eased = new THREE.Vector2();
  const draw = () => {
    if (
      !width ||
      !height ||
      disposed ||
      contextLost ||
      !visible ||
      document.hidden
    )
      return;
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      element.dataset.renderer = "webgl";
    }
  };
  const animate = (time: number) => {
    frame = 0;
    if (!active || !visible || document.hidden || disposed || contextLost)
      return;
    if (time - lastFrame >= 1000 / 30) {
      lastFrame = time;
      eased.lerp(pointer, 0.065);
      crest.rotation.y = -0.22 + eased.x * 0.065;
      crest.rotation.x = 0.08 + eased.y * 0.035;
      key.position.x = -3 + eased.x * 2;
      rim.position.y = -1 + eased.y;
      draw();
      // Lighting follows the pointer, then sleeps once the pose has settled.
      if (eased.distanceToSquared(pointer) < 0.000001) return;
    }
    frame = requestAnimationFrame(animate);
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    draw();
    if (active && visible && !document.hidden && !disposed) {
      frame = requestAnimationFrame(animate);
    }
  };
  const resize = () => {
    const bounds = element.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Retain the full wing span at narrow aspect ratios.
    camera.position.z = Math.max(7.8, 7.4 / camera.aspect);
    camera.updateProjectionMatrix();
    schedule();
  };
  const onPointer = (event: PointerEvent) => {
    if (!active || event.pointerType === "touch") return;
    const bounds = element.getBoundingClientRect();
    pointer.set(
      THREE.MathUtils.clamp(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
        -1,
        1,
      ),
      THREE.MathUtils.clamp(
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
        -1,
        1,
      ),
    );
    if (!frame && visible && !document.hidden && !contextLost) {
      frame = requestAnimationFrame(animate);
    }
  };
  const resetPointer = () => {
    pointer.set(0, 0);
    if (active && !frame && visible && !document.hidden && !contextLost) {
      frame = requestAnimationFrame(animate);
    }
  };
  const parent = element.closest(".hero-scene") ?? element;
  parent.addEventListener("pointermove", onPointer as EventListener, {
    passive: true,
  });
  parent.addEventListener("pointerleave", resetPointer);
  document.addEventListener("visibilitychange", schedule);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  intersection.observe(element);
  const onContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    active = false;
    contextLost = true;
    element.dataset.renderer = "vector";
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  resize();

  return {
    setActive(value) {
      active = value && !contextLost;
      element.dataset.motion = value ? "running" : "paused";
      schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      parent.removeEventListener("pointermove", onPointer as EventListener);
      parent.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", schedule);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      for (const mesh of meshes) mesh.dispose();
      face.dispose();
      edge.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
      element.dataset.renderer = "vector";
    },
  };
}
