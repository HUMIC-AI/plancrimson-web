import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { courses, subjectNames, tsne3d } from 'plancrimson-utils';
import { createRef, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { signInUser, handleError } from '@/src/hooks';

export function ClassesCloud() {
  const canvas = createRef<HTMLCanvasElement>();


  useEffect(() => {
    const { scene, camera, renderer } = createScene(canvas.current!);
    const controls = createControls(camera, renderer);
    const points = getPoints();
    scene.add(...points);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    scene.add(light);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }, []);


  return (
    <Layout className="flex flex-1 items-center justify-center bg-black p-8" title="Plan">
      <div className="absolute">
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
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  return { scene, camera, renderer };
}

function createControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 80;
  controls.autoRotate = true;
  return controls;
}

function getCourseColorsBySubject() {
  const color = new THREE.Color();
  const subjectColors = Object.fromEntries(subjectNames.map((subject, i) => {
    color.setHSL(i / subjectNames.length, 1, 0.5);
    return [subject, [color.r, color.g, color.b]] as const;
  }));
  return subjectColors;
}

function getPoints() {
  const points = [];
  const colors = getCourseColorsBySubject();
  for (let i = 0; i < courses.length; i += 1) {
    const geometry = new THREE.SphereGeometry(0.1, 12);
    const color = new THREE.Color();
    if (courses[i].subject in colors) {
      color.setRGB(...colors[courses[i].subject]);
    } else {
      color.setRGB(0.5, 0.5, 0.5);
    }
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    const pos = tsne3d[i];
    sphere.position.set(pos[0], pos[1], pos[2]);
    points.push(sphere);
  }
  return points;
}
