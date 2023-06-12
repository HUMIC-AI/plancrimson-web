import React from 'react';
import { Schedules } from '@/src/features';
import { useAppSelector } from '@/src/utils/hooks';
import { StyledOption } from './StyledOption';

export function ChooserOption({ scheduleId }: { scheduleId: string; }) {
  const schedule = useAppSelector(Schedules.selectSchedule(scheduleId));
  if (!schedule) return null;
  return (
    <StyledOption
      key={scheduleId}
      value={scheduleId}
    >
      <span className="flex w-min max-w-full space-x-2">
        <span className="grow overflow-auto whitespace-nowrap">
          {schedule.title}
        </span>
        <span>
          (
          {schedule.classes ? schedule.classes.length : 0}
          )
        </span>
      </span>
    </StyledOption>
  );
}
