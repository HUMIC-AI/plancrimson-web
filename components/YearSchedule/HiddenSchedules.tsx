import React from 'react';
import { Term, termToSemester } from '@/src/lib';
import { Planner, Schedules } from '@/src/features';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';


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
    <div className="mt-4">
      <span className="mr-1">Hidden schedules:</span>
      <ul className="inline">
        {Object.keys(hidden).map((data) => {
          let title: string;
          if (format === 'all') {
            title = schedules[data].title || data;
          } else {
            const semester = termToSemester(data as Term);
            title = `${semester.season} ${semester.year}`;
          }
          return (
            <li key={title} className="inline">
              <button
                type="button"
                onClick={() => {
                  if (format === 'all') {
                    dispatch(Planner.setHiddenId({ id: data, hidden: false }));
                  } else {
                    dispatch(Planner.setHiddenTerm({ term: data as Term, hidden: false }));
                  }
                }}
                className="interactive rounded px-1"
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
