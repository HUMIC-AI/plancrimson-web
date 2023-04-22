import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { courses, subjectNames, tsne3d } from 'plancrimson-utils';
import { createRef, PropsWithChildren, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';

const PARTICLE_SIZE = 0.5;
const sensitivity = 20;

/**
 * @param withControls Whether to add orbit controls.
 * @param autoRotate Whether to automatically rotate the camera. Only works if `withControls` is false.
 * Set to a number to control the speed.
 * @param interactive Whether to highlight points on hover.
 */
export function ClassesCloud({
  controls = 'none',
  autoRotate = 0,
  interactive = false,
  children,
}: PropsWithChildren<{
  controls?: 'track' | 'orbit' | 'none';
  autoRotate?: number;
  interactive?: boolean;
}>) {
  const canvas = createRef<HTMLCanvasElement>();

  useEffect(() => {
    const { scene, camera, renderer } = createScene(canvas.current!);

    const points = createPoints();
    scene.add(points);

    const orbitControls = controls === 'orbit' ? createControls(camera, renderer, autoRotate) : null;

    const mouseTracker = (controls === 'track' || interactive) ? createMouseTracker() : null;

    const raycaster = interactive ? createRaycaster(points) : null;

    const disposeResizeListener = syncWindow(camera, renderer);

    function animate() {
      requestAnimationFrame(animate);

      camera.lookAt(scene.position);

      if (orbitControls) orbitControls.update();

      if (controls === 'track') {
        camera.position.x += (mouseTracker!.mouse.x * sensitivity - camera.position.x) * 0.05;
        camera.position.y += (-mouseTracker!.mouse.y * sensitivity - camera.position.y) * 0.05;
      }

      if (raycaster) raycaster.update(mouseTracker!.mouse, camera);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (orbitControls) orbitControls.dispose();
      if (mouseTracker) mouseTracker.dispose();
      renderer.dispose();
      disposeResizeListener();
    };
  }, [canvas, autoRotate, controls, interactive]);

  return (
    <Layout className="relative flex flex-1 items-center justify-center bg-black p-8" title="Plan" transparentHeader>
      <div className="absolute inset-0 overflow-hidden">
        <canvas ref={canvas} />
      </div>
      {children}
    </Layout>
  );
}

/**
 * TypeScript workaround for updating a buffer attribute.
 */
function updateElement(buffer: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number, value: number) {
  (buffer.array as number[])[index] = value;
}

function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 30;

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

function createControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, autoRotate: number) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 60;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = !!autoRotate;
  controls.autoRotateSpeed = autoRotate;
  return controls;
}

function createPoints() {
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

function createRaycaster(points: THREE.Points) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points!.threshold = PARTICLE_SIZE / 2;
  let currentIntersect: number | null = null;
  const pointSizeBuffer = points.geometry.attributes.color;

  function update(mouse: THREE.Vector2, camera: THREE.Camera) {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([points], false);

    if (intersects.length > 0) {
      if (currentIntersect !== intersects[0].index) {
        if (currentIntersect !== null) {
          // Reset the previous point's size.
          updateElement(pointSizeBuffer, currentIntersect, PARTICLE_SIZE);
        }
        currentIntersect = intersects[0].index!;
        updateElement(pointSizeBuffer, currentIntersect, PARTICLE_SIZE * 2);
        pointSizeBuffer.needsUpdate = true;
      }
    } else if (currentIntersect !== null) {
      updateElement(pointSizeBuffer, currentIntersect, PARTICLE_SIZE);
      pointSizeBuffer.needsUpdate = true;
      currentIntersect = null;
    }
  }

  return {
    update,
  };
}

function createMouseTracker() {
  const mouse = new THREE.Vector2();

  // on pointer move, update the mouse vector
  const onPointerMove = (event: MouseEvent) => {
    mouse.x = -((event.clientX / window.innerWidth) * 2 - 1);
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  window.addEventListener('mousemove', onPointerMove);

  function dispose() {
    window.removeEventListener('mousemove', onPointerMove);
  }

  return { mouse, dispose };
}

function syncWindow(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}
