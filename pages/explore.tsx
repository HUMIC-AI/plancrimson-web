import { createRef, useEffect } from 'react';
import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import courses from '../shared/assets/allcourses-2022-06-08.json';
import embeddings from '../shared/assets/tsne.json';

type Mesh = three.Mesh<three.BufferGeometry, three.MeshPhongMaterial>;

function initScene(canvas: HTMLCanvasElement, labels: HTMLDivElement) {
  const scene = new three.Scene();

  const camera = new three.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 50;

  const renderer = new three.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const cube = (() => {
    const geometry = new three.BoxGeometry(1, 1, 1);
    const material = new three.MeshPhongMaterial({ color: 0x44aa88 });
    return new three.Mesh(geometry, material);
  })();
  scene.add(cube);

  {
    const light = new three.DirectionalLight(0xffddff, 1);
    light.position.set(-1, 1, 1).normalize();
    scene.add(light);
  }
  {
    const light = new three.DirectionalLight(0xffffdd, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
  }

  const controls = new OrbitControls(camera, canvas);
  // const controls = new FlyControls(camera, canvas);
  // controls.dragToLook = true;
  // controls.movementSpeed = 0.05;
  // controls.rollSpeed = 0.0005;

  // circles
  {
    const geometry = new three.SphereGeometry(1, 6, 6);
    const f = (t: number) => t + 5 * Math.random();
    const objects = embeddings.slice(0, 100).map(([x, y, z], i) => {
      const material = new three.MeshPhongMaterial({ color: 0x44aa88 });
      const mesh = new three.Mesh(geometry, material);
      mesh.position.set(f(x), f(y), f(z));

      const label = courses[i].SUBJECT + courses[i].CATALOG_NBR;
      const elem = document.createElement('div');
      elem.textContent = label;
      elem.classList.add('absolute', 'text-lg', 'cursor-pointer');
      labels.appendChild(elem);
      return { mesh, elem };
    });

    scene.add(...objects.map((obj) => obj.mesh));
  }

  const raycaster = new three.Raycaster();
  const pointer = new three.Vector2();

  // scene.children.forEach((node) => {
  //   const axes = new three.AxesHelper();
  //   if (axes.material instanceof three.Material) axes.material.depthTest = false;
  //   axes.renderOrder = 1;
  //   node.add(axes);
  // });

  // x red
  // y green
  // z blue
  // scene.add(new three.AxesHelper());

  canvas.addEventListener('mousemove', (ev) => {
    // both go from -1 to 1 from bottom left to top right
    pointer.x = (ev.clientX / canvas.clientWidth) * 2 - 1;
    pointer.y = -(ev.clientY / canvas.clientHeight) * 2 + 1;
    console.log(ev.clientX, ev.clientY, pointer.x, pointer.y);
  });

  let intersected: Mesh | null;

  function animate(delta: number) {
    delta *= 0.001;

    cube.rotation.x = delta;
    cube.rotation.y = delta;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, false);
    if (intersects.length > 0) {
      if (intersected !== intersects[0].object) {
        if (intersected) intersected.material.emissive.setHex(intersected.userData.currentHex);
        intersected = intersects[0].object as Mesh;
        intersected.userData.currentHex = intersected.material.emissive.getHex();
        intersected.material.emissive.setHex(0xff0000);
      }
    } else {
      if (intersected) intersected.material.emissive.setHex(intersected.userData.currentHex);
      intersected = null;
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

export default function ExplorePage() {
  const labels = createRef<HTMLDivElement>();
  const canvas = createRef<HTMLCanvasElement>();
  useEffect(() => initScene(canvas.current!, labels.current!), []);
  return (
    <div className="w-96 h-96 border-red-500 border-2">
      <canvas ref={canvas} className="outline-none w-full h-full" tabIndex={0} />
      <div ref={labels} className="absolute w-full h-full cursor-pointer text-xl" />
    </div>
  );
}
