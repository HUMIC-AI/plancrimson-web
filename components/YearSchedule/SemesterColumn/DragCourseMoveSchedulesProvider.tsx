import { ClassCache, Profile, Schedules } from '@/src/features';
import { Term } from '@/src/lib';
import { checkViable } from '@/src/searchSchedule';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  PropsWithChildren, createContext, useCallback, useContext, useMemo, useState,
} from 'react';
import { DragContext, DragStatus } from '../../../src/context/dragAndDrop';

interface DragMoveCourseData {
  classId: string;
  originScheduleId: string;
  originTerm: Term;
}

interface CourseDropArgs {
  scheduleId: string;
  term: Term | null;
}

type CourseDragContextType = DragContext<DragMoveCourseData, CourseDropArgs>;

const CourseDragContext = createContext<CourseDragContextType | null>(null);

export const useCourseDragContext = () => useContext(CourseDragContext);

export function DragCourseMoveSchedulesProvider({ children }: PropsWithChildren<{}>) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const schedules = useAppSelector(Schedules.selectSchedules);

  const [dragStatus, setDragStatus] = useState<DragStatus<DragMoveCourseData>>({
    dragging: false,
  });

  const draggedClass = dragStatus.dragging && classCache[dragStatus.data.classId];

  const checkViableDrop = useCallback(
    (scheduleId: string) => (profile.classYear && draggedClass && schedules[scheduleId]
      ? checkViable({
        cls: draggedClass,
        schedule: schedules[scheduleId],
        classYear: profile.classYear,
        classCache,
      })
      : null),
    [profile.classYear, draggedClass, schedules, classCache],
  );

  /**
   * @param scheduleId the schedule that the currently held course was dropped on
   */
  const handleDrop = useCallback(({ scheduleId, term }: CourseDropArgs) => {
    setDragStatus({ dragging: false });

    const viableDrop = checkViableDrop(scheduleId);

    if (!dragStatus.dragging || !scheduleId || !viableDrop) return;

    if (viableDrop.viability === 'No') {
      alert(viableDrop.reason);
    } else if (scheduleId !== dragStatus.data.originScheduleId) {
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
        dispatch(Schedules.addCourses({ scheduleId, courseIds: [classId] }));
        dispatch(Schedules.removeCourses({ scheduleId: originScheduleId, courseIds: [classId] }));
      }
    }
  }, [checkViableDrop, dragStatus, classCache, dispatch]);

  const value = useMemo<CourseDragContextType>(
    () => ({
      enabled: true,
      dragStatus,
      setDragStatus,
      handleDrop,
    }),
    [dragStatus, setDragStatus, handleDrop],
  );

  return (
    <CourseDragContext.Provider value={value}>
      {children}
    </CourseDragContext.Provider>
  );
}
