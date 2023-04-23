import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { courses, subjectNames, tsne3d } from 'plancrimson-utils';

const PARTICLE_SIZE = 0.5;

/**
 * TypeScript workaround for updating a buffer attribute.
 */
function updateElement(buffer: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number, value: number) {
  (buffer.array as number[])[index] = value;
}

export function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 30;
  camera.lookAt(scene.position);

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  return { scene, camera, renderer };
}

function getSubjectColors() {
  const color = new THREE.Color();
  const subjectColors = Object.fromEntries(subjectNames.map((subject, i) => {
    color.setHSL(i / subjectNames.length, 1, 0.5);
    return [subject, [color.r, color.g, color.b]] as const;
  }));
  return subjectColors;
}

export function createControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, autoRotate: number) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 60;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = !!autoRotate;
  controls.autoRotateSpeed = autoRotate;
  return controls;
}

export function createPoints() {
  const sprite = new THREE.TextureLoader().load('disc.png');
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    sizeAttenuation: true,
    map: sprite,
    alphaTest: 0.5,
    transparent: true,
    vertexColors: true,
  });

  const positions = tsne3d.flatMap((point) => [point[0], point[1], point[2]]);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const subjectColors = getSubjectColors();
  const colors = courses.flatMap((c) => subjectColors[c.subject] ?? [0, 0, 0]);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  // geometry.setAttribute('size', new THREE.Float32BufferAttribute(courses.map(() => PARTICLE_SIZE), 1));
  const points = new THREE.Points(geometry, material);
  return points;
}

export function createRaycaster(points: THREE.Points) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points!.threshold = PARTICLE_SIZE / 3; // arbitrary value
  let currentIntersect: number | null = null;
  let originalColor: readonly [number, number, number] | null = null;
  const colorBuffer = points.geometry.attributes.color;

  function update(mouse: THREE.Vector2, camera: THREE.Camera) {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(points, false);
    console.log(intersects.length);

    if (intersects.length > 0) {
      const topIntersect = intersects[0].index!;
      if (currentIntersect !== topIntersect) {
        if (currentIntersect !== null) {
          // Reset the previous point's color.
          for (let i = 0; i < 3; i += 1) {
            updateElement(colorBuffer, currentIntersect * 3 + i, originalColor![i]);
          }
        }
        currentIntersect = topIntersect;
        originalColor = [colorBuffer.getX(currentIntersect), colorBuffer.getY(currentIntersect), colorBuffer.getZ(currentIntersect)] as const;

        // take the RGB color, turn it into HSL, and then set the lightness to 0.5
        const color = new THREE.Color();
        color.setRGB(...originalColor!);
        const hsl = color.getHSL({ h: 0, s: 0, l: 0 });
        color.setHSL(hsl.h, hsl.s, 0.8);
        const rgb = color.toArray();

        for (let i = 0; i < 3; i += 1) {
          updateElement(colorBuffer, currentIntersect * 3 + i, rgb[i]);
        }
        colorBuffer.needsUpdate = true;
      }
    } else if (currentIntersect !== null) {
      for (let i = 0; i < 3; i += 1) {
        updateElement(colorBuffer, currentIntersect * 3 + i, originalColor![i]);
      }
      colorBuffer.needsUpdate = true;
      currentIntersect = null;
      originalColor = null;
    }
  }

  return {
    update,
    get currentIntersect() {
      return currentIntersect;
    },
  };
}

export function createMouseTracker() {
  const mouse = new THREE.Vector2();

  // on pointer move, update the mouse vector
  const onPointerMove = (event: MouseEvent) => {
    // range is -1 to 1. pay attention to the sign of the y axis
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  window.addEventListener('mousemove', onPointerMove);

  function dispose() {
    window.removeEventListener('mousemove', onPointerMove);
  }

  return { mouse, dispose };
}

export function syncWindow(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}
