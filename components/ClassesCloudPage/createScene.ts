import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Subject, getSubjectColor } from '@/src/lib';

type RGB = readonly [number, number, number];

/**
 * TypeScript workaround for updating a buffer attribute.
 */
function updateElement(buffer: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number, value: RGB) {
  const array = buffer.array as number[];
  for (let i = 0; i < 3; i += 1) {
    array[index * 3 + i] = value[i];
  }
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

export function createPoints(subjects: Subject[], positions: [number, number, number][], size: number) {
  const sprite = new THREE.TextureLoader().load('/disc.png');
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    map: sprite,
    alphaTest: 0.5,
    transparent: true,
    vertexColors: true,
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.flat(), 3));

  const colors = subjects.flatMap((subject) => new THREE.Color(getSubjectColor(subject)).toArray() ?? [0.5, 0.5, 0.5]);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const points = new THREE.Points(geometry, material);
  return points;
}

export function createRaycaster(points: THREE.Points, threshold: number) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points!.threshold = threshold;

  let currentIntersect: number | null = null;
  let originalColor: RGB | null = null;
  const colorBuffer = points.geometry.attributes.color;

  function update(mouse: THREE.Vector2, camera: THREE.Camera) {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(points, false);

    if (intersects.length > 0) {
      const topIntersect = intersects[0].index!;
      if (currentIntersect !== topIntersect) {
        if (currentIntersect !== null) {
          // Reset the previous point's color.
          updateElement(colorBuffer, currentIntersect, originalColor!);
        }
        currentIntersect = topIntersect;
        originalColor = [colorBuffer.getX(currentIntersect), colorBuffer.getY(currentIntersect), colorBuffer.getZ(currentIntersect)] as const;

        updateElement(colorBuffer, currentIntersect, [1, 1, 1]);
        colorBuffer.needsUpdate = true;
      }
    } else if (currentIntersect !== null) {
      updateElement(colorBuffer, currentIntersect, originalColor!);
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
