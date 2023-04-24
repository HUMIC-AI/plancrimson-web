import {
  PropsWithChildren, useEffect, useRef, useState,
} from 'react';
import Layout from '@/components/Layout/Layout';
import { breakpoints, classNames, useBreakpoint } from '@/src/utils/styles';
import { useModal } from '@/src/context/modal';
import { Subject, stringToHex } from 'plancrimson-utils';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { ClassCache } from '@/src/features';
import { useMeiliClient } from '@/src/context/meili';
import {
  createScene, createPoints, createControls, createMouseTracker, createRaycaster, syncWindow,
} from './createScene';

const sensitivity = 20;
const CLICK_DELAY = 200; // only register a click if the amount of time is less than this

type Props = {
  controls?: 'track' | 'orbit' | 'none';
  autoRotate?: number;
  interactive?: boolean;
};

export default function ClassesCloudPage({ children, ...props }: PropsWithChildren<Props>) {
  return (
    <Layout className="relative flex flex-1 items-center justify-center bg-black p-8" title="Plan" transparentHeader>
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
}: Props) {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isClick = useRef(false);
  const clickTimeout = useRef<ReturnType<typeof setTimeout>>();
  const gtSm = useBreakpoint(breakpoints.sm);
  const { showCourse } = useModal();
  const { positions, courses } = useData();
  const { client } = useMeiliClient();

  // if on mobile, use orbit controls instead of track controls
  const controls = rawControls === 'track' && !gtSm ? 'orbit' : rawControls;
  const currentHoverRef = useRef<number | null>(null);

  useEffect(() => {
    console.info('initializing scene');
    if (!canvasRef.current || !positions || !courses) return;

    const { scene, camera, renderer } = createScene(canvasRef.current!);

    const points = createPoints(courses.map((courseData) => courseData[1]), positions);
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
        camera.position.y += (mouseTracker!.mouse.y * sensitivity - camera.position.y) * 0.05;
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
  }, [positions, courses]);

  return (
    <div className={classNames(
      'absolute inset-0 overflow-hidden',
      'transition-opacity ease-in duration-[2000ms]',
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
              const courseKey = courses[idx][0];
              const courseId = stringToHex(courseKey);
              dispatch(ClassCache.loadCourses(client, [courseId])).then(([course]) => {
                showCourse(course);
              }).catch(alertUnexpectedError);
            }
          }

          isClick.current = false;
        }}
      />
    </div>
  );
}

function useData() {
  const [positions, setPositions] = useState<[number, number, number][] | null>(null);
  const [courses, setCourses] = useState<[string, Subject][] | null>(null);

  useEffect(() => {
    console.info('fetching data');

    fetch('/tsne.json')
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
      });

    fetch('/courses.json')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
      });
  }, []);

  return { positions, courses };
}
