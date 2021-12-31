import React from 'react';
import Layout from '../components/Layout/Layout';
import SemesterSchedule from '../components/SemesterSchedule/SemesterSchedule';
import { SelectedScheduleProvider } from '../src/context/selectedSchedule';

const SemesterPage: React.FC = function () {
  return (
    <Layout>
      <SelectedScheduleProvider>
        <SemesterSchedule />
      </SelectedScheduleProvider>
    </Layout>
  );
};

export default SemesterPage;
