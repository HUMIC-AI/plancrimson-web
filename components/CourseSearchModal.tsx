import React, { useMemo } from 'react';
import { SearchStateProvider } from '@/src/context/searchState';
import { ChosenScheduleContext } from '@/src/context/selectedSchedule';
import { AuthRequiredInstantSearchProvider } from '@/components/AuthRequiredInstantSearchProvider';
import { ToggleRefinement } from 'react-instantsearch-dom';
import SearchBox from './SearchComponents/SearchBox/SearchBox';
import Hits from './SearchComponents/Hits';


export default function CourseSearchModal({ selected, term }: { selected: string, term: string | undefined }) {
  const context = useMemo(() => ({ chosenScheduleId: selected, chooseSchedule() { } }), [selected]);

  return (
    <SearchStateProvider oneCol>
      <ChosenScheduleContext.Provider value={context}>
        <AuthRequiredInstantSearchProvider hitsPerPage={4}>
          {term && (
          <div className="hidden">
            <ToggleRefinement attribute="STRM" label="Term" value={term} defaultRefinement />
          </div>
          )}
          <div className="flex space-x-4">
            <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-light bg-white p-6 shadow-lg">
              <SearchBox scheduleChooser={false} />
              <Hits />
            </div>
          </div>
        </AuthRequiredInstantSearchProvider>
      </ChosenScheduleContext.Provider>
    </SearchStateProvider>
  );
}

