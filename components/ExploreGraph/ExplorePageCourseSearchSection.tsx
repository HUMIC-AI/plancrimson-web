import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import { SearchStateProvider, useDefaultSearchState } from '../../src/context/searchState';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import CurrentRefinements from '../SearchComponents/CurrentRefinements';
import CourseCardStyleProvider from '../../src/context/CourseCardStyleProvider';

export function ExplorePageCourseSearchSection({ showSortGrid = false }: { showSortGrid?: boolean; }) {
  const defaultState = useDefaultSearchState();

  return (
    <SearchStateProvider oneCol defaultState={defaultState} ignoreUrl>
      <AuthRequiredInstantSearchProvider indexName="courses" hitsPerPage={4}>
        <CourseCardStyleProvider defaultStyle="collapsed">
          {/* static positioning!!! happy */}
          <div className="space-y-4 rounded-xl py-6 text-xs transition-colors hover:bg-secondary/50">
            <SearchBox scheduleChooser={false} showSmallAttributeMenu showStats={false} />
            {showSortGrid && (
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <CurrentRefinements />
              </div>
            )}
            <Hits concise hideToggle />
          </div>
        </CourseCardStyleProvider>
      </AuthRequiredInstantSearchProvider>
    </SearchStateProvider>
  );
}
