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
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import {
  ClassCache, Planner, Profile, Schedules,
} from '@/src/features';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getClassIdsOfSchedule } from '@/src/features/schedules';
import { useChosenSchedule } from '../../src/context/ScheduleProvider';
import { useCourseCardStyle } from '../../src/context/CourseCardStyleProvider';

/**
 * A button that toggles a {@link CourseCard} in and out of a schedule.
 * @param scheduleId the schedule to add the class to
 * @param course the class to add
 */
export function CourseCardToggleButton({ course }: { course: ExtendedClass; }) {
  const { schedule } = useChosenSchedule();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);

  if (!schedule) return null;

  const isInSchedule = getClassIdsOfSchedule(schedule).includes(course.id);

  if (semesterFormat === 'sample' || !isInSchedule) {
    return (
      <AddClassButton course={course} />
    );
  }

  return (
    <RemoveClassButton classId={course.id} />
  );
}

CourseCardToggleButton.whyDidYouRender = {
  logOnDifferentValues: true,
};

export function AddClassButton({ course }: {
  course: ExtendedClass;
}) {
  const dispatch = useAppDispatch();
  const buttonSize = useButtonSize();
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

  return (
    <button
      type="button"
      name="Add class to schedule"
      onClick={addClass}
      className="interactive"
    >
      <FaPlusSquare size={buttonSize} />
    </button>
  );
}

export function RemoveClassButton({ classId }: { classId: string }) {
  const dispatch = useAppDispatch();
  const { id } = useChosenSchedule();
  const buttonSize = useButtonSize();

  return id ? (
    <button
      type="button"
      name="Remove class from schedule"
      onClick={() => confirm('Remove this course from your schedule?') && dispatch(Schedules.removeCourses({
        courseIds: [classId],
        scheduleId: id,
      }))}
      className="interactive"
    >
      <FaCheckSquare size={buttonSize} />
    </button>
  ) : null;
}

function useButtonSize() {
  const { style } = useCourseCardStyle();
  return style === 'expanded' ? 28 : 20;
}
