import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import SemesterSchedule from '../components/SemesterSchedule/SemesterSchedule';

const SemesterPage: React.FC = function () {
  const [selectedSchedule, selectSchedule] = useState('');
  return (
    <Layout>
      <SemesterSchedule
        selectedSchedule={selectedSchedule}
        selectSchedule={selectSchedule}
      />
    </Layout>
  );
};

export default SemesterPage;
