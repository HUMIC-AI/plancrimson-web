import { useRouter } from 'next/router';
import { useElapsed } from '@/src/utils/hooks';
import Layout from '@/components/Layout/Layout';
import Calendar from '@/components/SemesterSchedule/Calendar';
import { ErrorMessage } from '@/components/Layout/ErrorMessage';
import { useSchedule } from '@/src/utils/schedules';
import { useMemo } from 'react';
import { ChosenScheduleContext, ChosenScheduleContextType } from '../../src/context/selectedSchedule';

export default function SchedulePage() {
  return (
    <Layout title="Calendar" verify="meili" className="relative w-full max-w-screen-xl flex-1 bg-secondary xl:mx-auto">
      {({ userId }) => <Wrapper userId={userId} />}
    </Layout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Wrapper({ userId }: { userId: string; }) {
  const router = useRouter();
  const scheduleId = router.query.scheduleId as string;
  const { schedule, error } = useSchedule(scheduleId);
  const elapsed = useElapsed(500, []);

  const chosenScheduleContext = useMemo<ChosenScheduleContextType>(() => ({
    chosenScheduleId: scheduleId,
    chooseSchedule: () => null,
  }), [scheduleId]);

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!schedule) {
    return elapsed ? <ErrorMessage>Could not find schedule</ErrorMessage> : null;
  }

  return (
    <ChosenScheduleContext.Provider value={chosenScheduleContext}>
      <Calendar />
    </ChosenScheduleContext.Provider>
  );
}
