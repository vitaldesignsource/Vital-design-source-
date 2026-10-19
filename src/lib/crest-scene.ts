import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import geometry from "./crest-geometry.json";
import { getCrestFinish } from "./crest-finish";

export interface CrestScene {
  setActive: (active: boolean) => void;
  dispose: () => void;
}

/** One smooth, local-space light pass; the vector geometry stays untouched. */
function addSilverSweep(
  material: THREE.MeshStandardMaterial,
  sweep: { value: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uVitalSweep = sweep;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vVitalSourcePosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvVitalSourcePosition = position.xy;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vVitalSourcePosition;\nuniform float uVitalSweep;",
      )
      .replace(
        "#include <opaque_fragment>",
        `
        float vitalCoordinate = (vVitalSourcePosition.x + (1110.0 - vVitalSourcePosition.y) * 0.24) / 1683.4;
        float vitalBand = 1.0 - smoothstep(0.018, 0.105, abs(vitalCoordinate - uVitalSweep));
        outgoingLight += vec3(0.82, 0.96, 0.91) * pow(vitalBand, 2.0) * 0.36;
        #include <opaque_fragment>
      `,
      );
  };
  material.customProgramCacheKey = () => "vital-silver-sweep-v1";
}

/** A local studio environment: no external textures or requests are needed. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const background = context.createLinearGradient(0, 0, 0, 512);
  background.addColorStop(0, "#d2d6ce");
  background.addColorStop(0.42, "#3a453d");
  background.addColorStop(0.52, "#131b16");
  background.addColorStop(0.72, "#2b3a2f");
  background.addColorStop(1, "#657265");
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 512);
  for (const [x, width, color] of [
    [100, 125, "#ffffff"],
    [480, 55, "#dce8da"],
    [800, 60, "#f3f2e7"],
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
  const sweep = { value: -0.18 };
  const face = new THREE.MeshStandardMaterial({
    color: 0xe2e5dc,
    metalness: 0.92,
    roughness: 0.28,
    envMapIntensity: 1.4,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: 0x8b9a8d,
    metalness: 0.9,
    roughness: 0.24,
    envMapIntensity: 1.4,
  });
  addSilverSweep(face, sweep);
  addSilverSweep(edge, sweep);
  const finishes = new Map<
    string,
    [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial]
  >([["1:1", [face, edge]]]);
  const materialsFor = (pathIndex: number) => {
    const finish = getCrestFinish(pathIndex);
    const key = `${finish.faceOpacity}:${finish.edgeOpacity}`;
    let materials = finishes.get(key);
    if (!materials) {
      materials = [face.clone(), edge.clone()];
      for (const [index, material] of materials.entries()) {
        material.opacity =
          index === 0 ? finish.faceOpacity : finish.edgeOpacity;
        material.transparent = true;
        material.depthWrite = false;
        // A polished rim keeps the softened outer details sharply defined.
        material.roughness = index === 0 ? 0.23 : 0.2;
        addSilverSweep(material, sweep);
      }
      finishes.set(key, materials);
    }
    return materials;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}">${geometry.paths
    .map(
      (path) =>
        `<path d="${path.d}" transform="${path.transform}" fill="#fff"/>`,
    )
    .join("")}</svg>`;
  const paths = new SVGLoader().parse(svg).paths;
  const meshes: THREE.ExtrudeGeometry[] = [];
  for (const [pathIndex, path] of paths.entries()) {
    for (const shape of SVGLoader.createShapes(path)) {
      const meshGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: 40,
        bevelEnabled: true,
        bevelSegments: 6,
        steps: 1,
        bevelSize: 2,
        bevelThickness: 3.5,
        curveSegments: 8,
      });
      // Keep the caps planar. Bending sparse cap triangles creates visible
      // specular seams; crease-aware normals soften bevels without rounding
      // the intentional corners of the shield and feather tips.
      const flatNormals = meshGeometry.getAttribute("normal").clone();
      toCreasedNormals(meshGeometry, Math.PI / 3);
      const normals = meshGeometry.getAttribute("normal");
      const positions = meshGeometry.getAttribute("position");
      // Cap triangles must share one normal. Including their perimeter in the
      // bevel smoothing would spread different edge normals across large faces.
      for (const group of meshGeometry.groups) {
        if (group.materialIndex !== 0) continue;
        for (
          let vertex = group.start;
          vertex < group.start + group.count;
          vertex++
        ) {
          normals.setXYZ(
            vertex,
            flatNormals.getX(vertex),
            flatNormals.getY(vertex),
            flatNormals.getZ(vertex),
          );
        }
      }
      // A continuous, shallow crown in the shading gives the silver broad
      // reflections. Unlike a vertex displacement, it cannot crease the cap
      // into the long triangles produced by a detailed heraldic outline.
      const normal = new THREE.Vector3();
      for (let vertex = 0; vertex < positions.count; vertex++) {
        normal.fromBufferAttribute(normals, vertex);
        normal.x -= ((positions.getX(vertex) - 708) / 2400) * normal.z;
        normal.y += ((positions.getY(vertex) - 555) / 12000) * normal.z;
        normal.normalize();
        normals.setXYZ(vertex, normal.x, normal.y, normal.z);
      }
      meshes.push(meshGeometry);
      crest.add(new THREE.Mesh(meshGeometry, materialsFor(pathIndex)));
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x304c39, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xb6d9bb, 18, 15, 2);
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
  let sweepElapsed = 0;
  let sweepFrame: number | null = null;
  const sweepDuration = 4200;
  const updateSweepState = () => {
    element.dataset.sheenProgress = Math.min(
      sweepElapsed / sweepDuration,
      1,
    ).toFixed(4);
    if (contextLost || disposed) {
      element.dataset.sheen = "static";
      return;
    }
    element.dataset.sheen =
      sweepElapsed >= sweepDuration
        ? "settled"
        : active && visible && !document.hidden && !contextLost
          ? "running"
          : "paused";
  };
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
      if (sweepElapsed < sweepDuration) {
        if (sweepFrame !== null)
          sweepElapsed = Math.min(
            sweepDuration,
            sweepElapsed + time - sweepFrame,
          );
        sweepFrame = time;
        sweep.value = -0.18 + (sweepElapsed / sweepDuration) * 1.4;
        updateSweepState();
      }
      eased.lerp(pointer, 0.065);
      crest.rotation.y = -0.22 + eased.x * 0.065;
      crest.rotation.x = 0.08 + eased.y * 0.035;
      key.position.x = -3 + eased.x * 2;
      rim.position.y = -1 + eased.y;
      draw();
      // Sleep after the finite light pass and pointer interpolation settle.
      if (
        eased.distanceToSquared(pointer) < 0.000001 &&
        sweepElapsed >= sweepDuration
      )
        return;
    }
    frame = requestAnimationFrame(animate);
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    sweepFrame = null;
    updateSweepState();
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
    // Resolve fine heraldic details on Retina screens while bounding fill cost
    // on large displays. Only the light pass or pointer movement keeps drawing.
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2.5,
        Math.sqrt(2_400_000 / (width * height)),
      ),
    );
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
    element.dataset.sheen = "static";
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
      for (const materials of finishes.values()) {
        for (const material of materials) material.dispose();
      }
      environment.dispose();
      renderer.dispose();
      canvas.remove();
      element.dataset.renderer = "vector";
      element.dataset.sheen = "static";
    },
  };
}
