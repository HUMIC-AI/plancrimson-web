/* eslint-disable no-param-reassign */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { getAllSemesters, getSchedulesBySemester } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Schedule, Season } from '../../shared/firestoreTypes';
import { useClassCache } from '../../src/hooks';
import validateSchedules, { allRequirements, getReqs, RequirementsMet } from '../../src/requirements';
import basicRequirements from '../../src/requirements/cs/basic';
import { RequirementGroup } from '../../src/requirements/util';
import { DragStatus } from './CourseCard';
import RequirementsDisplay from './RequirementsDisplay';
import SemesterDisplay, { SelectedSchedules } from './SemesterDisplay';

const YearSchedule: React.FC = function () {
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  const { data } = useUserData();
  // selectedSchedules maps year + season to scheduleId
  const [selectedSchedules, setSelectedSchedules] = useState<SelectedSchedules>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(basicRequirements);
  const [highlightedClasses, setHighlightedClasses] = useState<string[]>([]);
  const numbers = useMemo(
    () => (data.schedules
      ? Object.values(data.schedules).map((s) => s.classes.map((c) => c.classId)).flat()
      : []),
    [data],
  );
  const { classCache } = useClassCache(numbers);

  const selectSchedule = (year: number, season: Season, schedule: Schedule) => {
    setSelectedSchedules((prev) => ({
      ...prev,
      [year + season]: schedule,
    }));
  };

  useEffect(() => {
    getAllSemesters(data).forEach(({ year, season }) => {
      if (!selectedSchedules[year + season]) {
        selectSchedule(
          year,
          season,
          getSchedulesBySemester(data, year, season)[0],
        );
      }
    });
  }, [data]);

  const revalidateSchedules = () => {
    const results = validateSchedules(
      Object.values(selectedSchedules),
      getReqs(selectedRequirements),
      data,
      classCache,
    );
    console.log({ results });
    setValidationResults(results);
  };

  useEffect(revalidateSchedules, [selectedSchedules, selectedRequirements, data, classCache]);

  console.log({ selectedSchedules });

  return (
    <div className="flex flex-col gap-4 container">
      <div className="p-4">
        Total courses:
        {' '}
        {Object.values(selectedSchedules).reduce((acc, schedule) => acc + schedule.classes.length, 0)}
        /32
      </div>

      <div className="grid overflow-x-auto grid-flow-col">
        {getAllSemesters(data).map(({ year, season }) => (
          <SemesterDisplay
            key={year + season}
            title={`${year} ${season}`}
            schedules={getSchedulesBySemester(data, year, season)}
            selectedSchedule={selectedSchedules[year + season]
              || Object.values(data.schedules).find((schedule) => schedule.year === year && schedule.season === season)!}
            selectSchedule={(schedule) => selectSchedule(year, season, schedule)}
            highlightedClasses={highlightedClasses}
            dragStatus={dragStatus}
            setDragStatus={setDragStatus}
          />
        ))}
      </div>

      <Listbox
        value={selectedRequirements.groupId}
        onChange={(groupId) => setSelectedRequirements(
          allRequirements.find((requirements) => requirements.groupId === groupId)!,
        )}
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
