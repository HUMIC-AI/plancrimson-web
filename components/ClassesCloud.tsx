import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { courses, subjectNames, tsne3d } from 'plancrimson-utils';
import { createRef, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { signInUser, handleError } from '@/src/hooks';

/**
 * @param autoRotate Whether to automatically rotate the camera. Only works if `withControls` is true.
 */
export function ClassesCloud({
  withControls = false,
  autoRotate = true,
}: {
  withControls?: boolean;
  autoRotate?: boolean;
}) {
  const canvas = createRef<HTMLCanvasElement>();

  useEffect(() => {
    const { scene, camera, renderer } = createScene(canvas.current!);

    const points = createPoints();
    scene.add(points);

    const controls = withControls ? createControls({
      camera,
      renderer,
      autoRotate,
    }) : null;

    const mouseTracker = withControls ? null : createMouseTracker(camera);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    function animate() {
      requestAnimationFrame(animate);

      camera.lookAt(scene.position);

      if (controls) controls.update();
      if (mouseTracker) mouseTracker.update();

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (controls) controls.dispose();
      if (mouseTracker) mouseTracker.dispose();
      renderer.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <Layout className="relative flex flex-1 items-center justify-center bg-black p-8" title="Plan" transparentHeader>
      <div className="absolute inset-0 overflow-hidden">
        <canvas ref={canvas} />
      </div>
      <button
        type="button"
        className="relative text-6xl font-black text-white drop-shadow-lg transition-opacity hover:opacity-80"
        onClick={() => signInUser().catch(handleError)}
      >
        Sign in to get started!
      </button>
    </Layout>
  );
}

function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.03);

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

function createControls({ autoRotate = false, camera, renderer }: {
  autoRotate?: boolean;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 80;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 0.5;
  return controls;
}

function createPoints() {
  const sprite = new THREE.TextureLoader().load('disc.png');
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size: 0.5,
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

  const points = new THREE.Points(geometry, material);
  return points;
}

function createMouseTracker(camera: THREE.PerspectiveCamera, sensitivity = 20) {
  const mouse = new THREE.Vector2();

  // on pointer move, update the mouse vector
  const onPointerMove = (event: MouseEvent) => {
    mouse.x = -((event.clientX / window.innerWidth) * 2 - 1) * sensitivity;
    mouse.y = ((event.clientY / window.innerHeight) * 2 - 1) * sensitivity;
  };

  window.addEventListener('mousemove', onPointerMove);

  function update() {
    camera.position.x += (mouse.x - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y - camera.position.y) * 0.05;
  }

  function dispose() {
    window.removeEventListener('mousemove', onPointerMove);
  }

  return { update, dispose };
}
