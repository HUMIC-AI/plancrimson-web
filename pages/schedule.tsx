import Layout from '../components/Layout/Layout';
import ScheduleChooser from '../components/ScheduleSelector';
import Calendar from '../components/SemesterSchedule/Calendar';
import UploadPlan from '../components/UploadPlan';
import ButtonMenu from '../components/YearSchedule/ButtonMenu';
import { allTruthy, sortSchedules } from '../shared/util';
import useChosenScheduleContext from '../src/context/selectedSchedule';
import { Schedules, ClassCache } from '../src/features';
import { useAppSelector } from '../src/hooks';

export default function SchedulePage() {
  const schedules = useAppSelector(Schedules.selectSchedules);
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const { chosenScheduleId, chooseSchedule } = useChosenScheduleContext();

  const chosenSchedule = chosenScheduleId ? schedules[chosenScheduleId] : null;
  const sortedSchedules = sortSchedules(schedules).map((schedule) => schedule.id);
  const selectedIndex = chosenScheduleId ? sortedSchedules.indexOf(chosenScheduleId) : null;
  const prevScheduleId = (selectedIndex !== null && selectedIndex > 0) ? sortedSchedules[selectedIndex - 1] : null;

  const allClasses = chosenSchedule ? allTruthy(chosenSchedule.classes.map(({ classId }) => classCache[classId])) : [];

  return (
    <Layout>
      <div className="space-y-4 py-8">
        <div className="flex flex-col sm:flex-row sm:space-x-4 items-center justify-center">
          <div className="text-center space-y-2 mb-4 sm:mb-0">
            <ScheduleChooser
              scheduleIds={sortedSchedules}
              handleChooseSchedule={chooseSchedule}
              chosenScheduleId={chosenScheduleId}
              direction="center"
              showDropdown
            />
            {chosenSchedule && (
            <div>
              <ButtonMenu
                year={chosenSchedule.year}
                season={chosenSchedule.season}
                chosenScheduleId={chosenScheduleId}
                handleChooseSchedule={chooseSchedule}
                prevScheduleId={prevScheduleId}
              />
            </div>
            )}
            <UploadPlan />
          </div>
        </div>

        <Calendar classes={allClasses} />
      </div>
    </Layout>
  );
}
