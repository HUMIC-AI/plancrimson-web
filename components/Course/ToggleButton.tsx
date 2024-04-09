import React from 'react';
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
import { getClassIdsOfSchedule } from '@/src/features/schedules';

export function CourseCardToggleButton({
  chosenScheduleId, courseId,
}: { chosenScheduleId: string; courseId: string; }) {
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const classYear = useAppSelector(Profile.selectClassYear);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const course = classCache[courseId] as ExtendedClass | undefined;

  // adds a class to the selected schedule.
  // linked to plus button in top right corner.
  function addClass() {
    if (!chosenSchedule || !classYear || !course) return;

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

    return dispatch(Schedules.addCourses({
      courses: [getClassId(course)],
      scheduleId: chosenSchedule.id,
    }));
  }

  if (!chosenSchedule) return null;

  const isInSchedule = getClassIdsOfSchedule(chosenSchedule).includes(courseId);

  if (semesterFormat === 'sample' || !isInSchedule) {
    return (
      <button
        type="button"
        name="Add class to schedule"
        onClick={addClass}
        className="primary rounded-full p-1 text-blue-primary transition-opacity hover:opacity-50"
      >
        <FaPlus />
      </button>
    );
  }

  return (
    <button
      type="button"
      name="Remove class from schedule"
      onClick={() => dispatch(Schedules.removeCourses({
        courseIds: [courseId],
        scheduleId: chosenSchedule.id,
      }))}
      className="primary rounded-full p-1 transition-opacity hover:opacity-50"
    >
      <FaTimes />
    </button>
  );
}
