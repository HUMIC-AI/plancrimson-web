/* eslint-disable no-param-reassign */
import { Listbox } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
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
import useCardStyle from '../../src/context/cardStyle';
import FadeTransition from '../FadeTransition';
import ExternalLink from '../ExternalLink';

type RequirementsSectionProps = {
  selectedRequirements: RequirementGroup;
  setSelectedRequirements: React.Dispatch<RequirementGroup>;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  notification: boolean;
  setNotification: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequirementsSection: React.FC<RequirementsSectionProps> = function ({
  selectedRequirements, setSelectedRequirements, validationResults, setHighlightedClasses, notification, setNotification,
}) {
  return (
    <div className="relative border-gray-200 space-y-4 md:border-2 md:rounded-lg md:shadow-lg md:max-w-md lg:max-w-lg w-screen">
      <div className="absolute inset-4 flex flex-col gap-4">
        <Listbox
          value={selectedRequirements.groupId}
          onChange={(groupId) => setSelectedRequirements(
            allRequirements.find((requirements) => requirements.groupId === groupId)!,
          )}
          as="div"
          className="relative"
        >
          <Listbox.Button className="shadow py-2 px-3 border-2 rounded w-full text-left flex justify-between items-center font-medium">
            {selectedRequirements.groupId}
            <FaChevronDown />
          </Listbox.Button>
          <FadeTransition>
            <Listbox.Options className="absolute w-full rounded-b-lg overflow-hidden shadow border">
              {allRequirements.map(({ groupId }) => (
                <Listbox.Option key={groupId} value={groupId} className="odd:bg-gray-300 even:bg-white py-2 px-4 font-medium">
                  {groupId}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </FadeTransition>
        </Listbox>

        {notification && (
        <button type="button" onClick={() => setNotification(false)} className="text-sm rounded-lg hover:opacity-50 hover:line-through transition-opacity bg-blue-300 italic text-left p-2">
          <span>
            Remember that this is only an unofficial tool and is not affiliated with Harvard. For up-to-date requirements,
            consult the
            {' '}
            <ExternalLink href="https://handbook.college.harvard.edu/">Harvard College Student Handbook</ExternalLink>
            {' '}
            or your Advising Report, which can be found by going to
            {' '}
            <ExternalLink href="https://my.harvard.edu/">my.harvard</ExternalLink>
            {' '}
            and clicking on &ldquo;My Program&rdquo;.
          </span>
        </button>
        )}

        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto border-y-2 border-black border-dashed">
            <RequirementsDisplay
              depth={0}
              requirements={selectedRequirements}
              validationResults={validationResults}
              setHighlightedClasses={setHighlightedClasses}
            />
          </div>
        </div>
      </div>
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
  const [notification, setNotification] = useState(true);
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
    <div className="grid grid-rows-1 h-screen md:grid-cols-[auto_1fr] items-stretch gap-4">
      <RequirementsSection
        {...{
          selectedRequirements,
          setSelectedRequirements,
          setHighlightedClasses,
          notification,
          setNotification,
          validationResults,
        }}
      />

      {/* this is the gray component, place it first on small devices */}
      <div className="relative bg-gray-800 p-4 md:rounded-lg md:shadow-lg row-start-1 md:row-auto overflow-auto max-w-full h-full">
        <div className="flex flex-col space-y-4 h-full">
          <p className="text-white flex flex-col md:flex-row items-center gap-4">
            <span>
              Total courses:
              {' '}
              {Object.values(scheduleIds).reduce((acc, schedule) => acc + (data.schedules[schedule]?.classes.length || 0), 0)}
              /32
            </span>
            <button type="button" onClick={() => expand(!isExpanded)} className="py-2 px-4 bg-black hover:opacity-50 transition-opacity rounded">
              {isExpanded ? 'Compact cards' : 'Expand cards'}
            </button>
          </p>

          <div className="relative overflow-x-auto flex-1">
            <div className="absolute inset-0 grid grid-flow-col rounded-lg overflow-auto">
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
      </div>
    </div>
  );
};

export default YearSchedule;
