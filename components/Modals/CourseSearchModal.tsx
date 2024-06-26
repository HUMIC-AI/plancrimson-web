import React, { useState } from 'react';
import { SearchStateProvider, useDefaultSearchState } from '@/src/context/searchState';
import { ScheduleProvider } from '@/src/context/ScheduleProvider';
import { AuthRequiredInstantSearchProvider } from '@/components/Utils/AuthRequiredInstantSearchProvider';
import {
  CURRENT_ARCHIVE_TERMS, CURRENT_COURSES_TERMS, Semester, semesterToTerm,
} from '@/src/lib';
import { Auth } from '@/src/features';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import { WithMeili } from '../Layout/WithMeili';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';


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
  const term = semesterToTerm(semester);
  const indexName = CURRENT_ARCHIVE_TERMS.includes(term) ? 'archive' : (CURRENT_COURSES_TERMS.includes(term) ? 'courses' : null);
  const [ignore, setIgnore] = useState(false);

  if (indexName === null && !ignore) {
    return (
      <div className="flex flex-col space-y-2 p-6">
        <p>
          Sorry, we don&apos;t have course data for this semester!
        </p>
        <button type="button" className="button secondary" onClick={() => setIgnore(true)}>Ignore</button>
      </div>
    );
  }

  return (
    // create a new search state provider to override the one in "pages/_app.tsx"
    <WithMeili userId={uid!}>
      <SearchStateProvider defaultState={defaultState} ignoreUrl>
        <ScheduleProvider id={selected}>
          <div className="flex-1 space-y-4 p-6 shadow-lg">
            <AuthRequiredInstantSearchProvider
              indexName={indexName ?? 'courses'}
              hitsPerPage={6}
            >
              <SearchBox scheduleChooser={false} showSmallAttributeMenu />
              <CourseCardStyleProvider defaultStyle="collapsed" columns={3}>
                <Hits concise />
              </CourseCardStyleProvider>
            </AuthRequiredInstantSearchProvider>
          </div>
        </ScheduleProvider>
      </SearchStateProvider>
    </WithMeili>
  );
}
