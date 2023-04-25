import { ClassCache, Profile, Schedules } from '@/src/features';
import { Term } from '@/src/lib';
import { checkViable } from '@/src/searchSchedule';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  PropsWithChildren, createContext, useCallback, useContext, useMemo, useState,
} from 'react';

export type DragStatus =
  | {
    dragging: false;
  }
  | {
    dragging: true;
    data: {
      classId: string;
      originScheduleId: string;
      originTerm: Term;
    };
  };

export type DragContext = {
  enabled: false;
} | {
  enabled: true;
  dragStatus: DragStatus;
  setDragStatus: (status: DragStatus) => void;
  checkViableDrop: (scheduleId: string) => ReturnType<typeof checkViable> | null;
  handleDrop: (scheduleId: string, term: Term | null) => void;
};

const DragAndDropContext = createContext<DragContext>({
  enabled: false,
});

export const useDragAndDropContext = () => useContext(DragAndDropContext);

export function DragAndDropProvider({ children }: PropsWithChildren<{}>) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(Profile.selectUserProfile);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const schedules = useAppSelector(Schedules.selectSchedules);

  const [dragStatus, setDragStatus] = useState<DragStatus>({
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
  const handleDrop = useCallback((scheduleId: string, term: Term | null) => {
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
        dispatch(Schedules.addCourses({ scheduleId, courses: [{ classId }] }));
        dispatch(Schedules.removeCourses({ scheduleId: originScheduleId, courseIds: [classId] }));
      }
    }
  }, [dragStatus, classCache]);

  const value = useMemo(
    () => ({
      enabled: true,
      dragStatus,
      setDragStatus,
      checkViableDrop,
      handleDrop,
    }),
    [dragStatus, setDragStatus, checkViableDrop, handleDrop],
  );

  return (
    <DragAndDropContext.Provider value={value}>
      {children}
    </DragAndDropContext.Provider>
  );
}
