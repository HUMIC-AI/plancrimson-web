import React, { useMemo } from 'react';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '@/src/context/searchState';
import { ChosenScheduleContext } from '@/src/context/selectedSchedule';
import { AuthRequiredInstantSearchProvider } from '@/components/AuthRequiredInstantSearchProvider';
import type { Semester } from '@/src/lib';
import SearchBox from './SearchComponents/SearchBox/SearchBox';
import Hits from './SearchComponents/Hits';


/**
 * Used in the main course planning page to search for courses to add to the schedule
 */
export default function CourseSearchModal({ selected, semester }: {
  selected: string;
  semester?: Semester;
}) {
  const context = useMemo(() => ({ chosenScheduleId: selected, chooseSchedule() { } }), [selected]);

  return (
    // create a new search state provider to override the one in "pages/_app.tsx"
    <SearchStateProvider oneCol defaultState={semester && getDefaultSearchStateForSemester(semester)}>
      <ChosenScheduleContext.Provider value={context}>
        <AuthRequiredInstantSearchProvider hitsPerPage={4}>
          <div className="flex space-x-4">
            <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-secondary p-6 shadow-lg">
              <SearchBox scheduleChooser={false} />
              <Hits />
            </div>
          </div>
        </AuthRequiredInstantSearchProvider>
      </ChosenScheduleContext.Provider>
    </SearchStateProvider>
  );
}

