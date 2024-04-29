import React, { useCallback } from 'react';
import {
  FaCheckSquare, FaPlusSquare,
} from 'react-icons/fa';
import {
  ExtendedClass,
  getClassId,
  semesterToTerm,
} from '@/src/lib';
import { checkViable } from '@/src/searchSchedule';
import { useAppDispatch, useAppSelector, alertUnexpectedError } from '@/src/utils/hooks';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getClassIdsOfSchedule } from '@/src/features/schedules';
import { useChosenSchedule } from '../../src/context/ScheduleProvider';
import { useCourseCardStyle } from '../../src/context/CourseCardStyleProvider';
import { classNames } from '../../src/utils/styles';

/**
 * A button that toggles a {@link CourseCard} in and out of a schedule.
 * @param scheduleId the schedule to add the class to
 * @param course the class to add
 */
export function CourseCardToggleButton({ course }: { course: ExtendedClass; }) {
  const { schedule } = useChosenSchedule();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const addClass = useAddClass(course);
  const removeClass = useRemoveClass(course.id, schedule ? schedule.id : null);
  const { style } = useCourseCardStyle();
  const buttonSize = style === 'expanded' ? 28 : 20;

  if (!schedule) return null;

  const isInSchedule = getClassIdsOfSchedule(schedule).includes(course.id);
  const add = semesterFormat === 'sample' || !isInSchedule;

  return (
    <button
      type="button"
      name={add ? 'Add class to schedule' : 'Remove class from schedule'}
      onClick={add ? addClass : removeClass}
      className={classNames('interactive ease-in-out', add ? 'rotate-90' : 'text-blue-primary')}
    >
      {add ? <FaPlusSquare size={buttonSize} /> : <FaCheckSquare size={buttonSize} />}
    </button>
  );
}

function useRemoveClass(classId: string, scheduleId: string | null) {
  const dispatch = useAppDispatch();
  const { confirmRemoval } = useCourseCardStyle();
  const removeClass = useCallback(() => {
    if (!scheduleId) {
      alert('An unexpected error occurred.');
      return;
    }

    if (confirmRemoval && !confirm('Remove this course from your schedule?')) return;

    dispatch(Schedules.removeCourses({
      courseIds: [classId],
      scheduleId,
    })).catch(alertUnexpectedError);
  }, [classId, confirmRemoval, dispatch, scheduleId]);

  return removeClass;
}

function useAddClass(course: ExtendedClass) {
  const dispatch = useAppDispatch();
  const { schedule } = useChosenSchedule();
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
  }, [classCache, classYear, course, dispatch, schedule]);

  return addClass;
}
