/* eslint-disable no-param-reassign */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { getUniqueSemesters, getSchedulesBySemester } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Season } from '../../shared/firestoreTypes';
import validateSchedules, { allRequirements, getReqs, RequirementsMet } from '../../src/requirements';
import basicRequirements from '../../src/requirements/cs/basic';
import { RequirementGroup } from '../../src/requirements/util';
import RequirementsDisplay from './RequirementsDisplay';
import SemesterDisplay from './SemesterDisplay';
import { DragStatus } from '../Course/CourseCard';
import useClassCache from '../../src/context/classCache';

const YearSchedule: React.FC = function () {
  const [dragStatus, setDragStatus] = useState<DragStatus>({
    dragging: false,
  });
  const { data } = useUserData();
  // scheduleIds maps year + season to scheduleId
  const [scheduleIds, setSelectedSchedules] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<RequirementsMet>({});
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementGroup>(basicRequirements);
  const [highlightedClasses, setHighlightedClasses] = useState<string[]>([]);
  const { getClass } = useClassCache(data);

  const selectSchedule = (year: number, season: Season, schedule: string) => {
    setSelectedSchedules((prev) => ({
      ...prev,
      [year + season]: schedule,
    }));
  };

  useEffect(() => {
    getUniqueSemesters(data).forEach(({ year, season }) => {
      if (!scheduleIds[year + season]) {
        selectSchedule(
          year,
          season,
          getSchedulesBySemester(data, year, season)[0].id,
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const revalidateSchedules = () => {
    const results = validateSchedules(
      Object.values(scheduleIds).map((id) => data.schedules[id]),
      getReqs(selectedRequirements),
      data,
      getClass,
    );
    setValidationResults(results);
  };

  useEffect(revalidateSchedules, [scheduleIds, selectedRequirements, data, getClass]);

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4 container">
      <div className="flex-1 max-w-2xl bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-white">
          Total courses:
          {' '}
          {Object.values(scheduleIds).reduce((acc, schedule) => acc + (data.schedules[schedule]?.classes.length || 0), 0)}
          /32
        </p>

        <div className="grid overflow-x-auto mt-4 grid-flow-col">
          {getUniqueSemesters(data).map(({ year, season }) => (
            <SemesterDisplay
              key={year + season}
              year={year}
              season={season}
              selectedScheduleId={scheduleIds[year + season] || null}
              selectSchedule={(id) => selectSchedule(year, season, id)}
              highlightedClasses={highlightedClasses}
              dragStatus={dragStatus}
              setDragStatus={setDragStatus}
            />
          ))}
        </div>
      </div>

      <div>
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

        <div className="max-h-screen h-min overflow-y-auto">
          <RequirementsDisplay
            depth={0}
            requirements={selectedRequirements}
            validationResults={validationResults}
            setHighlightedClasses={setHighlightedClasses}
          />
        </div>
      </div>
    </div>
  );
};

export default YearSchedule;
