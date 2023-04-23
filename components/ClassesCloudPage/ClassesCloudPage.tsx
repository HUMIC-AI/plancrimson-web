import {
  createRef, PropsWithChildren, useEffect, useState,
} from 'react';
import Layout from '@/components/Layout/Layout';
import { breakpoints, useBreakpoint } from '@/src/utils/styles';
import {
  createScene, createPoints, createControls, createMouseTracker, createRaycaster, syncWindow,
} from './createScene';

export const PARTICLE_SIZE = 0.5;
const sensitivity = 20;

/**
 * @param withControls Whether to add orbit controls.
 * @param autoRotate Whether to automatically rotate the camera. Only works if `withControls` is false.
 * Set to a number to control the speed.
 * @param interactive Whether to highlight points on hover.
 */
export function ClassesCloud({
  controls: rawControls = 'none',
  autoRotate = 0,
  interactive = false,
  children,
}: PropsWithChildren<{
  controls?: 'track' | 'orbit' | 'none';
  autoRotate?: number;
  interactive?: boolean;
}>) {
  const canvas = createRef<HTMLCanvasElement>();
  const gtSm = useBreakpoint(breakpoints.sm);

  // if on mobile, use orbit controls instead of track controls
  const controls = rawControls === 'track' && !gtSm ? 'orbit' : rawControls;
  const [currentHover, setCurrentHover] = useState<number | null>(null);

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

      if (raycaster) {
        raycaster.update(mouseTracker!.mouse, camera);
        if (raycaster.currentIntersect !== currentHover) {
          console.log(raycaster.currentIntersect);
          setCurrentHover(raycaster.currentIntersect);
        }
      }

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


