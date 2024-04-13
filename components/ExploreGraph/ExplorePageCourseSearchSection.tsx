import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import { SearchStateProvider, useDefaultSearchState } from '../../src/context/searchState';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import { SortingAndRefinementsGrid } from '../SearchComponents/CurrentRefinements';

export function ExplorePageCourseSearchSection() {
  const defaultState = useDefaultSearchState();

  return (
    <SearchStateProvider oneCol defaultState={defaultState} ignoreUrl>
      <AuthRequiredInstantSearchProvider indexName="courses" hitsPerPage={4}>
        {/* static positioning!!! happy */}
        <div className="space-y-4 rounded-xl py-6 transition-colors hover:bg-secondary/50">
          <SearchBox scheduleChooser={false} showSmallAttributeMenu />
          <div className="rounded-xl border border-primary bg-secondary/80 p-2">
            <SortingAndRefinementsGrid indexName="courses" />
          </div>
          <Hits />
        </div>
      </AuthRequiredInstantSearchProvider>
    </SearchStateProvider>
  );
}
