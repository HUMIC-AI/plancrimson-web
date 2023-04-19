import React from 'react';
import { Term } from 'plancrimson-utils';
import { termToSemester } from 'plancrimson-utils';
import { Planner, Schedules } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/hooks';


export default function HiddenSchedules() {
  const dispatch = useAppDispatch();
  const format = useAppSelector(Planner.selectSemesterFormat);
  const hiddenTerms = useAppSelector(Planner.selectHiddenTerms);
  const hiddenIds = useAppSelector(Planner.selectHiddenIds);
  const schedules = useAppSelector(Schedules.selectSchedules);
  const hidden = format === 'all' ? hiddenIds : hiddenTerms;

  if (Object.keys(hidden).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center text-white">
      <h3>Hidden schedules:</h3>
      <ul className="flex items-center">
        {Object.keys(hidden).map((data) => {
          let title: string;
          if (format === 'all') {
            title = schedules[data].title || data;
          } else {
            const semester = termToSemester(data as Term);
            title = `${semester.season} ${semester.year}`;
          }
          return (
            <li key={title} className="ml-2">
              <button
                type="button"
                onClick={() => {
                  if (format === 'all') {
                    dispatch(Planner.setHiddenId({ id: data, hidden: false }));
                  } else {
                    dispatch(Planner.setHiddenTerm({ term: data as Term, hidden: false }));
                  }
                }}
                className="interactive"
              >
                {title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
