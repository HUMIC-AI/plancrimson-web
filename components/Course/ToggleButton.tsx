import React, { PropsWithChildren, useCallback } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import {
  ExtendedClass,
  getClassId,
  semesterToTerm,
} from '@/src/lib';
import { checkViable } from '@/src/searchSchedule';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { GRAPH_SCHEDULE, getClassIdsOfSchedule } from '@/src/features/schedules';

export function CourseCardToggleButton({
  chosenScheduleId, course,
}: { chosenScheduleId: string; course: ExtendedClass; }) {
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const classYear = useAppSelector(Profile.selectClassYear);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // adds a class to the selected schedule.
  // linked to plus button in top right corner.
  const addClass = useCallback(() => {
    if (!chosenSchedule || !classYear || !course) return;

    if (chosenSchedule.id !== GRAPH_SCHEDULE) {
      const viability = checkViable({
        cls: course,
        schedule: chosenSchedule,
        classCache,
        classYear,
      });

      if (viability.viability === 'No') {
        alert(viability.reason);
        return;
      }

      if (viability.viability === 'Unlikely') {
        const yn = confirm(`${viability.reason} Continue anyways?`);
        if (!yn) return;
      }

      logEvent(getAnalytics(), 'add_class', {
        subject: course.SUBJECT,
        catalogNumber: course.CATALOG_NBR,
        term: semesterToTerm(chosenSchedule),
      });
    }

    return dispatch(Schedules.addCourses({
      courseIds: [getClassId(course)],
      scheduleId: chosenSchedule.id,
    }));
  }, [chosenSchedule, classYear, course, classCache, dispatch]);

  if (!chosenSchedule) return null;

  const isInSchedule = getClassIdsOfSchedule(chosenSchedule).includes(course.id);

  if (semesterFormat === 'sample' || !isInSchedule) {
    return (
      <ToggleButton
        name="Add class to schedule"
        onClick={addClass}
      >
        <FaPlus />
      </ToggleButton>
    );
  }

  return (
    <ToggleButton
      name="Remove class from schedule"
      onClick={() => dispatch(Schedules.removeCourses({
        courseIds: [course.id],
        scheduleId: chosenSchedule.id,
      }))}
    >
      <FaTimes />
    </ToggleButton>
  );
}

export function ToggleButton({
  children, onClick, name,
}: PropsWithChildren<{
  onClick: () => void;
  name: string;
}>) {
  return (
    <button
      type="button"
      name={name}
      onClick={onClick}
      className="secondary interactive round"
    >
      {children}
    </button>
  );
}
