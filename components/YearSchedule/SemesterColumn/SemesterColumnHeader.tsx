import React, { useRef, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { compareSemesters, Semester } from 'plancrimson-utils';
import { useAppDispatch, useAppSelector } from '@/src/hooks';
import { Planner, Schedules, Settings } from '@/src/features';
import { getSchedulesBySemester } from '@/src/utils';
import ScheduleChooser from '../../ScheduleChooser';
import FadeTransition from '../../Utils/FadeTransition';
import ButtonMenu from '../ButtonMenu';

type HeaderProps = {
  highlight: string | undefined;
  semester: Semester;
  chosenScheduleId: string | null;
  colWidth: number;
};

/**
 * The header for a semester
 * @param highlight the highlighted requirement
 * @param semester the semester
 * @param chosenScheduleId the schedule to show
 * @param colWidth the width of the column
 */
export function HeaderSection({
  highlight, semester, chosenScheduleId, colWidth,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const semesterFormat = useAppSelector(Planner.selectSemesterFormat);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const currentSchedules = getSchedulesBySemester(schedules, semester);

  // independent to sync up the transitions nicely
  const [scheduleTitle, setScheduleTitle] = useState<string>();
  const [showSelector, setShowSelector] = useState(true);
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null!);

  const prevScheduleId = currentSchedules.find((schedule) => schedule.id !== chosenScheduleId)?.id ?? null;

  async function handleRenameSchedule(ev: React.FormEvent) {
    ev.preventDefault();
    if (!chosenScheduleId) {
      alert('no schedule selected to rename');
      return;
    }
    if (!scheduleTitle) {
      alert('invalid title given');
      return;
    }
    await dispatch(Schedules.renameSchedule({ scheduleId: chosenScheduleId, title: scheduleTitle }));
    setEditing(false);
  }

  const doHighlight = typeof highlight !== 'undefined' && highlight === chosenScheduleId;

  const chooseSchedule = (scheduleId: string | null) => dispatch(Settings.chooseSchedule({
    term: `${semester.year}${semester.season}`,
    scheduleId,
  }));

  return (
    <div className="flex flex-col items-stretch space-y-2 border-b-2 border-black p-4">
      {semesterFormat !== 'all' && (
        <h3 className="text-center">
          <button
            type="button"
            className="transition-opacity hover:line-through hover:opacity-50"
            title="Hide this semester"
            onClick={() => {
              // hide the semester
              if (semesterFormat === 'selected') {
                dispatch(Planner.setHiddenTerm({ term: `${semester.year}${semester.season}`, hidden: true }));
              } else if (chosenScheduleId) {
                dispatch(Planner.setHiddenId({ id: chosenScheduleId, hidden: true }));
              }
            }}
          >
            {semester.season}
            {' '}
            {semester.year}
          </button>
        </h3>
      )}

      <FadeTransition
        show={editing}
        unmount={false}
        beforeEnter={() => setShowSelector(false)}
        afterLeave={() => setShowSelector(true)}
      >
        <form
          className="relative"
          onSubmit={handleRenameSchedule}
        >
          <input
            type="text"
            value={scheduleTitle}
            onChange={({ currentTarget }) => setScheduleTitle(
              currentTarget.value
                .replace(/[^a-zA-Z0-9-_ ]/g, '')
                .slice(0, 30),
            )}
            className="w-full rounded border-2 py-1 pl-2 pr-7 shadow-inner focus:shadow"
            ref={editRef}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-2 flex items-center"
          >
            <FaCheck />
          </button>
        </form>
      </FadeTransition>

      {semesterFormat !== 'sample' && showSelector && (
        <ScheduleChooser
          scheduleIds={currentSchedules.sort(compareSemesters).map((s) => s.id)}
          chosenScheduleId={chosenScheduleId}
          handleChooseSchedule={chooseSchedule}
          direction="center"
          parentWidth={`${colWidth}px`}
          showTerm={semesterFormat === 'all' ? 'on' : 'off'}
          highlight={doHighlight}
          showDropdown={semesterFormat !== 'all'}
          season={semester.season}
          year={semester.year}
        />
      )}

      {semesterFormat !== 'sample' && (
        <ButtonMenu
          prevScheduleId={prevScheduleId}
          handleChooseSchedule={chooseSchedule}
          chosenScheduleId={chosenScheduleId}
        />
      )}
    </div>
  );
}
