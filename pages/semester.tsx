import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import SemesterSchedule from '../components/SemesterSchedule/SemesterSchedule';
import useUserData from '../src/context/userData';
import { Schedule } from '../shared/firestoreTypes';

const SemesterPage: React.FC = function () {
  const { data } = useUserData();
  const { query, replace } = useRouter();
  const [selectedSchedule, selectSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (typeof query.selected === 'string') {
      selectSchedule(data.schedules[query.selected]);
    }
  }, [query, data]);

  return (
    <Layout>
      <SemesterSchedule
        selectSchedule={(schedule) => { replace(`/semester?selected=${encodeURIComponent(schedule.id)}`); }}
        selectedSchedule={selectedSchedule}
        schedules={Object.values(data.schedules)}
      />
    </Layout>
  );
};

export default SemesterPage;
