/* eslint-disable no-param-reassign */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useMemo, useState } from 'react';
import useUserData from '../../src/context/userData';
import { useClassCache } from '../../src/hooks';
import validateSchedules, { allRequirements, getReqs, RequirementsMet } from '../../src/schedules';
import basicRequirements from '../../src/schedules/cs/basic';
import { RequirementGroup } from '../../src/schedules/util';
import { getAllSemesters } from '../../src/util';
import { DragStatus } from './CourseCard';
import RequirementsDisplay from './RequirementsDisplay';
import SemesterDisplay, { SelectedSchedules } from './SemesterDisplay';

const YearSchedule: React.FC = function () {
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  // selectedSchedules maps year + season to scheduleId
  const [selectedSchedules, setSelectedSchedules] = useState<SelectedSchedules>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(basicRequirements);
  const [highlightedClasses, setHighlightedClasses] = useState<string[]>([]);
  const { data } = useUserData();
  const numbers = useMemo(() => (data.schedules ? Object.values(data.schedules).map((s) => s.classes.map((c) => c.classId)).flat() : []), [data]);
  const { classCache } = useClassCache(numbers);

  useEffect(() => {
    const results = validateSchedules(
      Object.values(selectedSchedules).map((scheduleId) => data.schedules[scheduleId]),
      getReqs(selectedRequirements),
      data,
      classCache,
    );
    setValidationResults(results);
  }, [selectedSchedules, selectedRequirements, data, classCache]);

  return (
    <div className="flex flex-col gap-4 container">
      <div className="p-4">
        Total courses:
        {' '}
        {Object.values(selectedSchedules).reduce((acc, schedule) => acc + data.schedules[schedule].classes.length, 0)}
        /32
      </div>

      <div className="grid overflow-x-auto grid-flow-col">
        {getAllSemesters(data).map(({ year, season }) => (
          <SemesterDisplay
            key={year + season}
            selectedSchedules={selectedSchedules}
            setSelectedSchedules={setSelectedSchedules}
            highlightedClasses={highlightedClasses}
            year={year}
            season={season}
            dragStatus={dragStatus}
            setDragStatus={setDragStatus}
          />
        ))}
      </div>

      <Listbox
        value={selectedRequirements.groupId}
        onChange={(groupId) => setSelectedRequirements(allRequirements.find((requirements) => requirements.groupId === groupId)!)}
      >
        <Listbox.Button className="shadow py-2 px-3 rounded">
          {selectedRequirements.groupId}
        </Listbox.Button>
        <Listbox.Options>
          {allRequirements.map(({ groupId }) => (
            <Listbox.Option key={groupId} value={groupId}>
              {groupId}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>

      <RequirementsDisplay
        requirements={selectedRequirements}
        validationResults={validationResults}
        setHighlightedClasses={setHighlightedClasses}
      />
    </div>
  );
};

export default YearSchedule;
