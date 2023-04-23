import {
  PropsWithChildren, useEffect, useRef,
} from 'react';
import Layout from '@/components/Layout/Layout';
import { breakpoints, useBreakpoint } from '@/src/utils/styles';
import {
  createScene, createPoints, createControls, createMouseTracker, createRaycaster, syncWindow,
} from './createScene';

const sensitivity = 20;

/**
 * @param withControls Whether to add orbit controls.
 * @param autoRotate Whether to automatically rotate the camera. Only works if `withControls` is false.
 * Set to a number to control the speed.
 * @param interactive Whether to highlight points on hover.
 */
export default function ClassesCloud({
  controls: rawControls = 'none',
  autoRotate = 0,
  interactive = false,
  children,
}: PropsWithChildren<{
  controls?: 'track' | 'orbit' | 'none';
  autoRotate?: number;
  interactive?: boolean;
}>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gtSm = useBreakpoint(breakpoints.sm);

  // if on mobile, use orbit controls instead of track controls
  const controls = rawControls === 'track' && !gtSm ? 'orbit' : rawControls;
  const currentHoverRef = useRef<number | null>(null);

  useEffect(() => {
    console.info('initializing scene');
    const { scene, camera, renderer } = createScene(canvasRef.current!);

    const points = createPoints();
    scene.add(points);

    const orbitControls = controls === 'orbit' ? createControls(camera, renderer, autoRotate) : null;

    const mouseTracker = (controls === 'track' || interactive) ? createMouseTracker() : null;

    const raycaster = interactive ? createRaycaster(points) : null;

    const disposeResizeListener = syncWindow(camera, renderer);

    function animate() {
      requestAnimationFrame(animate);

      if (orbitControls) orbitControls.update();

      if (controls === 'track') {
        camera.position.x += (mouseTracker!.mouse.x * sensitivity - camera.position.x) * 0.05;
        camera.position.y += (-mouseTracker!.mouse.y * sensitivity - camera.position.y) * 0.05;
      }

      if (raycaster) {
        raycaster.update(mouseTracker!.mouse, camera);
        if (raycaster.currentIntersect !== currentHoverRef.current) {
          currentHoverRef.current = raycaster.currentIntersect;
        }
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    return () => {
      scene.children.forEach((child) => scene.remove(child));
      if (orbitControls) orbitControls.dispose();
      if (mouseTracker) mouseTracker.dispose();
      renderer.dispose();
      disposeResizeListener();
    };
  }, []);

  return (
    <Layout className="relative flex flex-1 items-center justify-center bg-black p-8" title="Plan" transparentHeader>
      <div className="absolute inset-0 overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
      {children}
    </Layout>
  );
}
