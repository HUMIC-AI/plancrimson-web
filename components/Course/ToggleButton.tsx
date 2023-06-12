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
import { getClasses } from '@/src/features/schedules';

export function ToggleButton({ chosenScheduleId, course }: { chosenScheduleId: string; course: ExtendedClass; }) {
  const dispatch = useAppDispatch();
  const chosenSchedule = useAppSelector(Schedules.selectSchedule(chosenScheduleId));
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const classYear = useAppSelector(Profile.selectClassYear);
  const classCache = useAppSelector(ClassCache.selectClassCache);

  // adds a class to the selected schedule.
  // linked to plus button in top right corner.
  function addClass() {
    if (!chosenSchedule || !classYear) return;

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

  const inSchedule = getClasses(chosenSchedule).find((classId) => course.id === classId);

  if (semesterFormat === 'sample' || !inSchedule) {
    return (
      <button
        type="button"
        name="Add class to schedule"
        onClick={addClass}
        className="transition-opacity hover:opacity-50"
      >
        <FaPlus color="white" />
      </button>
    );
  }

  return (
    <button
      type="button"
      name="Remove class from schedule"
      onClick={() => dispatch(Schedules.removeCourses({
        courseIds: [getClassId(course)],
        scheduleId: chosenSchedule.id,
      }))}
      className="transition-opacity hover:opacity-50"
    >
      <FaTimes className="text-yellow" />
    </button>
  );
}
