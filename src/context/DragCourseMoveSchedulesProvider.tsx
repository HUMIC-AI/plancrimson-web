import { ClassCache, Profile, Schedules } from '@/src/features';
import { Term } from '@/src/lib';
import { checkViable } from '@/src/searchSchedule';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  PropsWithChildren, createContext, useCallback, useContext, useMemo, useState,
} from 'react';
import { LocalSchedule } from '../types';

type DragStatus<T> =
  | {
    dragging: false;
  }
  | {
    dragging: true;
    data: T;
  };

interface DragContext<DragData, DropArgs> {
  dragStatus: DragStatus<DragData>;
  setDragStatus: (status: DragStatus<DragData>) => void;
  handleDrop: (drop: DropArgs) => void;
}

interface DragMoveCourseData {
  classId: string;
  originScheduleId: string;
  originTerm: Term;
}

interface CourseDropArgs {
  targetSchedule: LocalSchedule;
  term: Term | null;
}

type CourseDragContextType = DragContext<DragMoveCourseData, CourseDropArgs>;

const CourseDragContext = createContext<CourseDragContextType | null>(null);

export const useCourseDragContext = () => useContext(CourseDragContext);

export function DragCourseMoveSchedulesProvider({ children }: PropsWithChildren<{}>) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  const [dragStatus, setDragStatus] = useState<DragStatus<DragMoveCourseData>>({
    dragging: false,
  });

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  /**
   * @param schedule the target schedule that the currently held course was dropped onto
   */
  const handleDrop = useCallback(({ targetSchedule, term }: CourseDropArgs) => {
    const viableDrop = (profile.classYear && draggedClass && targetSchedule
      ? checkViable({
        cls: draggedClass,
        schedule: targetSchedule,
        classYear: profile.classYear,
        classCache,
      })
      : null);

    if (!dragStatus.dragging || !viableDrop) return;

    setDragStatus({ dragging: false });

    if (viableDrop.viability === 'No') {
      alert(viableDrop.reason);
    } else if (targetSchedule.id !== dragStatus.data.originScheduleId) {
      const doAdd = viableDrop.viability !== 'Unlikely' || confirm(`${viableDrop.reason} Continue anyways?`);
      if (doAdd) {
        const { classId, originScheduleId, originTerm } = dragStatus.data;
        const analytics = getAnalytics();
        logEvent(analytics, 'move_course', {
          subject: classCache[classId]?.SUBJECT,
          catalogNumber: classCache[classId]?.CATALOG_NBR,
          originTerm,
          destinationTerm: term,
        });
        dispatch(Schedules.addCourses({ scheduleId: targetSchedule.id, courseIds: [classId] }));
        dispatch(Schedules.removeCourses({ scheduleId: originScheduleId, courseIds: [classId] }));
      }
    }
  }, [classCache, dispatch, dragStatus, draggedClass, profile.classYear]);

  const value = useMemo<CourseDragContextType>(
    () => ({
      enabled: true,
      dragStatus,
      setDragStatus,
      handleDrop,
    }),
    [dragStatus, handleDrop],
  );

  return (
    <CourseDragContext.Provider value={value}>
      {children}
    </CourseDragContext.Provider>
  );
}

export function GraphDragDropProvider({ children }: PropsWithChildren<{}>) {
  const dispatch = useAppDispatch();
  const [dragStatus, setDragStatus] = useState<DragStatus<DragMoveCourseData>>({ dragging: false });

  const context = useMemo<CourseDragContextType>(() => ({
    dragStatus,
    setDragStatus,
    handleDrop: ({ targetSchedule }) => dragStatus.dragging && dispatch(Schedules.addCourses({
      scheduleId: targetSchedule.id, // should always be GRAPH_SCHEDULE
      courseIds: [dragStatus.data.classId],
    })),
  }), [dispatch, dragStatus]);

  return (
    <CourseDragContext.Provider value={context}>
      {children}
    </CourseDragContext.Provider>
  );
}
