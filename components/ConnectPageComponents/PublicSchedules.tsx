import ScheduleSection from '@/components/SemesterSchedule/ScheduleList';
import { Schedules } from '@/src/features';
import { useAppSelector } from '@/src/utils/hooks';

export default function PublicSchedules() {
  // the proper schedules are already selected by the constraints argument to Layout
  const schedules = useAppSelector(Schedules.selectSchedules);

  if (Object.values(schedules).length === 0) {
    return <p>Nobody has made a public schedule yet. Keep an eye out!</p>;
  }

  return (
    <ul className="mt-6">
      {Object.values(schedules).filter((schedule) => schedule.public).map((schedule) => (
        <li key={schedule.id}>
          <ScheduleSection schedule={schedule} />
        </li>
      ))}
    </ul>
  );
}
