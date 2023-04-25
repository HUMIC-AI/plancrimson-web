import {
  PropsWithChildren, useEffect, useRef, useState,
} from 'react';
import Layout from '@/components/Layout/Layout';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import { useModal } from '@/src/context/modal';
import { Subject, getClassId } from '@/src/lib';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { ClassCache } from '@/src/features';
import { useMeiliClient } from '@/src/context/meili';
import type { CourseLevel } from '@/src/types';
import { useData } from './useData';

const sensitivity = 20;
const CLICK_DELAY = 200; // only register a click if the amount of time is less than this

type Props = {
  controls?: 'track' | 'orbit' | 'none';
  autoRotate?: number;
  interactive?: boolean;
  particleSize?: number;
  level?: CourseLevel;
  filterSubjects?: Subject[];
};

export default function ClassesCloudPage({ children, ...props }: PropsWithChildren<Props>) {
  return (
    <Layout className="relative flex flex-1 items-center justify-center bg-black" title="Plan" transparentHeader>
      <ClassesCloud {...props} />
      {children}
    </Layout>
  );
}

/**
 * @param withControls Whether to add orbit controls.
 * @param autoRotate Whether to automatically rotate the camera. Only works if `withControls` is false.
 * Set to a number to control the speed.
 * @param interactive Whether to highlight points on hover.
 */
function ClassesCloud({
  controls: rawControls = 'none',
  autoRotate = 0,
  interactive = false,
  particleSize = 1,
  level = 'all',
  filterSubjects,
}: Props) {
  const dispatch = useAppDispatch();
  const isClick = useRef(false);
  const clickTimeout = useRef<ReturnType<typeof setTimeout>>();
  const gtSm = useBreakpoint(breakpoints.sm);
  const { showCourse } = useModal();
  const { positions, courses } = useData(level, filterSubjects);
  const { client } = useMeiliClient();
  const [sceneUtils, setSceneUtils] = useState<typeof import('./createScene')>();

  // if on mobile, use orbit controls instead of track controls
  const controls = rawControls === 'track' && !gtSm ? 'orbit' : rawControls;

  // refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentHoverRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene>();
  const pointsRef = useRef<THREE.Points>();

  // dynamically import createScene to minimize bundle size
  useEffect(() => {
    import('./createScene')
      .then((mod) => setSceneUtils(mod))
      .catch(alertUnexpectedError);
  }, []);

  useEffect(() => {
    if (!sceneUtils || !canvasRef.current) return;

    console.info('initializing scene');

    const { scene, camera, renderer } = sceneUtils.createScene(canvasRef.current!);
    sceneRef.current = scene;

    const orbitControls = controls === 'orbit' ? sceneUtils.createControls(camera, renderer, autoRotate) : null;

    const mouseTracker = (controls === 'track' || interactive) ? sceneUtils.createMouseTracker() : null;

    const raycaster = interactive ? sceneUtils.createRaycaster(particleSize / 3) : null;

    const disposeResizeListener = sceneUtils.syncWindow(camera, renderer);

    function animate() {
      requestAnimationFrame(animate);

      if (orbitControls) orbitControls.update();

      if (controls === 'track') {
        camera.position.x += (mouseTracker!.mouse.x * sensitivity - camera.position.x) * 0.05;
        camera.position.y += (mouseTracker!.mouse.y * sensitivity - camera.position.y) * 0.05;
      }

      if (raycaster && pointsRef.current) {
        raycaster.update(pointsRef.current, mouseTracker!.mouse, camera);
        if (raycaster.currentIntersect !== currentHoverRef.current) {
          currentHoverRef.current = raycaster.currentIntersect;
        }
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    return () => {
      scene.children.forEach((child) => scene.remove(child));
      sceneRef.current = undefined;
      pointsRef.current = undefined;
      currentHoverRef.current = null;
      if (orbitControls) orbitControls.dispose();
      if (mouseTracker) mouseTracker.dispose();
      renderer.dispose();
      disposeResizeListener();
    };
  }, [sceneUtils]);

  useEffect(() => {
    if (!sceneUtils || !positions || !courses) return;
    if (pointsRef.current) sceneRef.current!.remove(pointsRef.current);
    pointsRef.current = sceneUtils.createPoints(courses.map((courseData) => courseData[1]), positions, particleSize);
    sceneRef.current!.add(pointsRef.current);
  }, [sceneUtils, positions, courses]);

  return (
    <div className={classNames(
      'absolute inset-0 overflow-hidden',
      'transition-opacity ease-in duration-1000',
      (positions && courses) ? 'opacity-100' : 'opacity-0',
    )}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={() => {
          isClick.current = true;
          clickTimeout.current = setTimeout(() => {
            isClick.current = false;
          }, CLICK_DELAY);
        }}
        onMouseUp={() => {
          clearTimeout(clickTimeout.current);

          if (isClick.current) {
            const idx = currentHoverRef.current;
            if (idx !== null && courses) {
              const key = courses[idx][0];
              const courseId = getClassId(key);
              dispatch(ClassCache.loadCourses(client, [courseId]))
                .then(([course]) => {
                  showCourse(course);
                })
                .catch(alertUnexpectedError);
            }
          }

          isClick.current = false;
        }}
      />
    </div>
  );
}

