import { getUpcomingSemester } from '../../src/lib';
import { AuthRequiredInstantSearchProvider } from '../AuthRequiredInstantSearchProvider';
import { SearchStateProvider, getDefaultSearchStateForSemester } from '../../src/context/searchState';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';

export function ExplorePageCourseSearchSection() {
  return (
    <div className="absolute inset-y-0 left-0 flex w-full max-w-xs flex-col space-y-4 overflow-hidden p-2">
      <SearchStateProvider oneCol defaultState={getDefaultSearchStateForSemester(getUpcomingSemester())} ignoreUrl>
        <AuthRequiredInstantSearchProvider hitsPerPage={4}>
          <SearchBox scheduleChooser={false} showSmallAttributeMenu />
          <div className="relative flex-1">
            <div className="absolute inset-0 overflow-auto">
              <Hits />
            </div>
          </div>
        </AuthRequiredInstantSearchProvider>
      </SearchStateProvider>
    </div>
  );
}
