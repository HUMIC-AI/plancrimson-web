import React from 'react';
import type { ExtendedClass } from '@/src/lib';
import {
  allTruthy, getClassId,
  getEvents,
  getSectionEvents,
} from '@/src/lib';
import { useAppSelector } from '@/src/utils/hooks';
import { ClassCache, Settings } from '@/src/features';
import { BaseSchedule } from '@/src/types';
import { CalendarHeaderSection } from './CalendarPageHeaderSection';
import { CalendarBody } from './CalendarBody';

type CalendarProps = {
  schedule: BaseSchedule;
};


/**
 * Main calendar view of the Calendar page.
 */
export default function Calendar({ schedule }: CalendarProps) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const classes = allTruthy(schedule.classes ? schedule.classes.map((classId) => classCache[classId]) : []);

  const customTimes = useAppSelector(Settings.selectCustomTimes);

  /**
   * Extends a class with user-provided custom time information
   */
  function extendCustomTime(cls: ExtendedClass): ExtendedClass & { CUSTOM_PLANNED?: true } {
    const classId = getClassId(cls);
    if (!(classId in customTimes)) return cls;
    return {
      ...cls,
      IS_SCL_MEETING_PAT: customTimes[classId].pattern
        .map((a) => a.slice(0, 2))
        .join(' '),
      IS_SCL_STRT_TM_DEC: customTimes[classId].start.toString(),
      IS_SCL_END_TM_DEC: customTimes[classId].end.toString(),
      START_DT: `${customTimes[classId].startDate}-00.00.00.000000`,
      END_DT: `${customTimes[classId].endDate}-00.00.00.000000`,
      CUSTOM_PLANNED: true,
    };
  }

  const extendedClasses = classes.map(extendCustomTime);
  const courseEvents = extendedClasses.flatMap(getEvents);
  const sections = extendedClasses.flatMap(getSectionEvents);
  const events = [...courseEvents, ...sections.flatMap((s) => s.events)];

  return (
    <div className="flex flex-col md:absolute md:inset-4 md:flex-row md:space-x-4">
      <CalendarHeaderSection events={events} schedule={schedule} />
      <CalendarBody classes={[...extendedClasses, ...sections.flatMap((s) => s.tbas)]} events={events} />
    </div>
  );
}


