import React, { useCallback } from 'react';
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
import { useChosenSchedule } from '../../src/context/selectedSchedule';

/**
 * A button that toggles a class in and out of a schedule.
 * @param scheduleId the schedule to add the class to
 * @param course the class to add
 */
export function CourseCardToggleButton({ course }: { course: ExtendedClass; }) {
  const dispatch = useAppDispatch();
  const { schedule } = useChosenSchedule();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const classYear = useAppSelector(Profile.selectClassYear);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // adds a class to the selected schedule.
  // linked to plus button in top right corner.
  const addClass = useCallback(() => {
    if (!schedule || !classYear || !course) return;

    const viability = checkViable({
      cls: course,
      schedule,
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
      term: semesterToTerm(schedule),
    });

    return dispatch(Schedules.addCourses({
      courseIds: [getClassId(course)],
      scheduleId: schedule.id,
    }));
  }, [schedule, classYear, course, classCache, dispatch]);

  if (!schedule) return null;

  const isInSchedule = getClassIdsOfSchedule(schedule).includes(course.id);

  if (semesterFormat === 'sample' || !isInSchedule) {
    return (
      <button
        type="button"
        name="Add class to schedule"
        onClick={addClass}
        className="secondary interactive round"
      >
        <FaPlus />
      </button>
    );
  }

  return (
    <RemoveClassButton classId={course.id} />
  );
}
export function RemoveClassButton({ classId }: { classId: string }) {
  const dispatch = useAppDispatch();
  const { id } = useChosenSchedule();

  return id ? (
    <button
      type="button"
      name="Remove class from schedule"
      onClick={() => dispatch(Schedules.removeCourses({
        courseIds: [classId],
        scheduleId: id,
      }))}
      className="secondary interactive round"
    >
      <FaTimes />
    </button>
  ) : null;
}

