import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { courses, subjectNames, tsne3d } from 'plancrimson-utils';
import { createRef, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { signInUser, handleError } from '@/src/hooks';

export function ClassesCloud() {
  const canvas = createRef<HTMLCanvasElement>();


  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas.current! });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 80;
    controls.autoRotate = true;

    const points = tsne3d.map((point) => new THREE.Vector3(point[0], point[1], point[2]));

    const material = new THREE.PointsMaterial({ vertexColors: true });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const color = new THREE.Color();
    const subjectColors = Object.fromEntries(subjectNames.map((subject, i) => {
      color.setHSL(i / subjectNames.length, 1, 0.5);
      return [subject, [color.r, color.g, color.b]] as const;
    }));
    const colors = courses.flatMap((c) => subjectColors[c.subject] ?? [0, 0, 0]);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const scatterPlot = new THREE.Points(geometry, material);
    scene.add(scatterPlot);

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

