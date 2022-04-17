import { useRouter } from 'next/router';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// components
import Layout from '../components/Layout/Layout';
import ScheduleSelector from '../components/ScheduleSelector';
import Calendar from '../components/SemesterSchedule/Calendar';
import UploadPlan from '../components/UploadPlan';
import ButtonMenu from '../components/YearSchedule/ButtonMenu';
import { Season, SEASON_ORDER } from '../shared/firestoreTypes';
import { allTruthy, classNames, sortSchedules } from '../shared/util';
import { useAppDispatch, useAppSelector } from '../src/app/hooks';
import { selectClassCache } from '../src/features/classCache';
import { createSchedule, selectSchedules } from '../src/features/schedules';
import { selectUserUid } from '../src/features/userData';

export default function SchedulePage() {
  const dispatch = useAppDispatch();
  const userUid = useAppSelector(selectUserUid);
  const schedules = useAppSelector(selectSchedules);
  const { query } = useRouter();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    typeof query.selected === 'string' ? query.selected : null,
  );

  const classCache = useAppSelector(selectClassCache);

  const newSemester: React.FormEventHandler<HTMLFormElement> = async (ev) => {
    ev.preventDefault();
    const fields = new FormData(ev.currentTarget);
    try {
      const season = fields.get('season');
      if (typeof season !== 'string' || !(season in SEASON_ORDER)) {
        throw new Error('Invalid season');
      }
      if (!userUid) {
        throw new Error('User not logged in');
      }

      const schedule = await dispatch(createSchedule({
        uid: uuidv4(),
        ownerUid: userUid,
        public: false,
        id: fields.get('semesterId') as string,
        year: parseInt(fields.get('year') as string, 10),
        season: season as Season,
        classes: [],
        force: true,
      }));

      if (!('errors' in schedule.payload)) {
        setSelectedScheduleId(schedule.payload.id);
      }
    } catch (err) {
      alert(
        "Couldn't create a schedule! Make sure you provided valid values and try again.",
      );
      console.error(err);
    }
  };

  const selectedSchedule = (selectedScheduleId && schedules[selectedScheduleId]) || null;
  const sortedSchedules = sortSchedules(schedules);
  const selectedIndex = sortedSchedules.findIndex(
    (schedule) => schedule.id === selectedScheduleId,
  );
  const prevScheduleId = selectedIndex > 0 ? sortedSchedules[selectedIndex - 1].id : null;

  return (
    <Layout>
      <div className="space-y-4 py-8">
        <div className="flex flex-col sm:flex-row sm:space-x-4 items-center justify-center">
          <div className="text-center space-y-2 mb-4 sm:mb-0">
            <ScheduleSelector
              schedules={sortedSchedules}
              selectSchedule={(schedule) => setSelectedScheduleId(schedule ? schedule.id : null)}
              selectedSchedule={selectedSchedule}
              direction="center"
              showDropdown
            />
            {selectedSchedule && (
            <div>
              <ButtonMenu
                year={selectedSchedule.year}
                season={selectedSchedule.season}
                selectedSchedule={selectedSchedule}
                selectSchedule={setSelectedScheduleId}
                prevScheduleId={prevScheduleId}
              />
            </div>
            )}
            <UploadPlan />
          </div>

          <form
            onSubmit={newSemester}
            className="sm:rounded-lg sm:max-w-md p-2 bg-gray-300 flex flex-col sm:flex-row flex-wrap gap-2"
          >
            <input
              type="text"
              name="semesterId"
              placeholder="Schedule name"
              className="focus:ring-blue-700 rounded py-2 px-3 flex-1"
            />
            <input
              type="number"
              name="year"
              placeholder="Year"
              className="focus:ring-blue-700 sm:max-w-xs rounded py-2 px-3 flex-shrink"
            />
            <select name="season" className="rounded py-2 pl-2 pr-6 flex-1">
              {['Spring', 'Fall'].map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={classNames(
                'flex-1 py-2 px-3 font-semibold hover-blue min-w-max',
              )}
            >
              Add new schedule
            </button>
          </form>
        </div>

        <Calendar
          classes={allTruthy(
            selectedSchedule
              ? selectedSchedule.classes.map(
                ({ classId }) => classCache[classId],
              )
              : [],
          )}
        />
      </div>
    </Layout>
  );
}
