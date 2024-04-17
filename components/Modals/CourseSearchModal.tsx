import React from 'react';
import { SearchStateProvider, useDefaultSearchState } from '@/src/context/searchState';
import { ScheduleIdProvider } from '@/src/context/selectedSchedule';
import { AuthRequiredInstantSearchProvider } from '@/components/Utils/AuthRequiredInstantSearchProvider';
import { Semester, isOldSemester } from '@/src/lib';
import { Auth } from '@/src/features';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import { WithMeili } from '../Layout/WithMeili';


/**
 * Used in the main course planning page to search for courses to add to the schedule
 * See also {@link CustomModal} and `src/context/modal.tsx`
 */
export default function CourseSearchModal({ selected, semester }: {
  selected: string;
  semester: Semester;
}) {
  const uid = Auth.useAuthProperty('uid');
  const defaultState = useDefaultSearchState(semester);
  const indexName = isOldSemester(semester) ? 'archive' : 'courses';

  return (
    // create a new search state provider to override the one in "pages/_app.tsx"
    <WithMeili userId={uid!}>
      <SearchStateProvider oneCol defaultState={defaultState} ignoreUrl>
        <ScheduleIdProvider id={selected}>
          <AuthRequiredInstantSearchProvider
            indexName={indexName}
            hitsPerPage={4}
          >
            <div className="flex space-x-4">
              <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-secondary p-6 shadow-lg">
                <SearchBox scheduleChooser={false} showSmallAttributeMenu />
                <Hits />
              </div>
            </div>
          </AuthRequiredInstantSearchProvider>
        </ScheduleIdProvider>
      </SearchStateProvider>
    </WithMeili>
  );
}
