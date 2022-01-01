/* eslint-disable no-param-reassign */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { getUniqueSemesters, getSchedulesBySemester, classNames } from '../../shared/util';
import useUserData from '../../src/context/userData';
import { Season } from '../../shared/firestoreTypes';
import validateSchedules, { allRequirements, getReqs, RequirementsMet } from '../../src/requirements';
import basicRequirements from '../../src/requirements/cs/basic';
import { RequirementGroup } from '../../src/requirements/util';
import RequirementsDisplay from './RequirementsDisplay';
import SemesterDisplay from './SemesterDisplay';
import { DragStatus } from '../Course/CourseCard';
import useClassCache from '../../src/context/classCache';
import useCardStyle from '../../src/context/cardStyle';
import FadeTransition from '../FadeTransition';

type RequirementsSectionProps = {
  selectedRequirements: RequirementGroup;
  setSelectedRequirements: React.Dispatch<RequirementGroup>;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
};

const RequirementsSection: React.FC<RequirementsSectionProps> = function ({
  selectedRequirements, setSelectedRequirements, validationResults, setHighlightedClasses,
}) {
  return (
    <div className="border-gray-200 md:border-2 md:rounded-lg md:shadow-lg p-4 overflow-y-auto w-screen md:max-w-sm">
      <Listbox
        value={selectedRequirements.groupId}
        onChange={(groupId) => setSelectedRequirements(
          allRequirements.find((requirements) => requirements.groupId === groupId)!,
        )}
        as="div"
        className="relative mb-4"
      >
        <Listbox.Button className="shadow py-2 px-3 border-2 rounded w-full text-left flex justify-between items-center">
          {selectedRequirements.groupId}
          <FaChevronDown />
        </Listbox.Button>
        <FadeTransition>
          <Listbox.Options className="absolute mt-2 rounded-lg overflow-hidden">
            {allRequirements.map(({ groupId }) => (
              <Listbox.Option key={groupId} value={groupId} className="even:bg-gray-400 odd:bg-gray-200 py-1 px-2">
                {groupId}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </FadeTransition>
      </Listbox>

      <RequirementsDisplay
        depth={0}
        requirements={selectedRequirements}
        validationResults={validationResults}
        setHighlightedClasses={setHighlightedClasses}
      />
    </div>
  );
};

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
  const { isExpanded, expand } = useCardStyle();
  const getClass = useClassCache(data);

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

  useEffect(() => {
    const results = validateSchedules(
      Object.values(scheduleIds).map((id) => data.schedules[id]),
      getReqs(selectedRequirements),
      data,
      getClass,
    );
    setValidationResults(results);
  }, [scheduleIds, selectedRequirements, data, getClass]);

  return (
    <div className="grid md:grid-cols-[auto_1fr] md:flex-row-reverse items-stretch gap-4">
      <RequirementsSection
        selectedRequirements={selectedRequirements}
        setHighlightedClasses={setHighlightedClasses}
        setSelectedRequirements={setSelectedRequirements}
        validationResults={validationResults}
      />

      {/* place it first on small devices */}
      <div className="bg-gray-800 p-4 md:rounded-lg md:shadow-lg overflow-auto row-start-1 md:row-auto">
        <p className="text-white">
          <span>
            Total courses:
            {' '}
            {Object.values(scheduleIds).reduce((acc, schedule) => acc + (data.schedules[schedule]?.classes.length || 0), 0)}
            /32
          </span>
          <button type="button" onClick={() => expand(!isExpanded)} className={classNames('hover-blue ml-4 py-2 px-4 rounded')}>
            {isExpanded ? 'Compact cards' : 'Expand cards'}
          </button>
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
    </div>
  );
};

export default YearSchedule;
