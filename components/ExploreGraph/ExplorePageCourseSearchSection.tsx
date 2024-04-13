import { Disclosure } from '@headlessui/react';
import { FaAngleDoubleRight } from 'react-icons/fa';
import { AuthRequiredInstantSearchProvider } from '../Utils/AuthRequiredInstantSearchProvider';
import { SearchStateProvider, useDefaultSearchState } from '../../src/context/searchState';
import SearchBox from '../SearchComponents/SearchBox/SearchBox';
import Hits from '../SearchComponents/Hits';
import { classNames } from '../../src/utils/styles';
import { SortingAndRefinementsGrid } from '../SearchComponents/CurrentRefinements';

export function ExplorePageCourseSearchSection() {
  const defaultState = useDefaultSearchState();
  return (
    <Disclosure>
      {({ open }) => (
        <div className={classNames(
          'absolute bottom-0 left-0 top-16 w-full max-w-xs md:max-w-sm',
          'transition-transform duration-200',
          open ? 'translate-x-4' : '-translate-x-full',
        )}
        >
          <Disclosure.Panel
            unmount={false}
            className="flex h-full flex-col space-y-4 py-6"
          >
            <SearchStateProvider oneCol defaultState={defaultState} ignoreUrl>
              <AuthRequiredInstantSearchProvider indexName="courses" hitsPerPage={4}>
                <SearchBox scheduleChooser={false} showSmallAttributeMenu />
                <div className="rounded border border-primary bg-secondary/80 p-2">
                  <SortingAndRefinementsGrid indexName="courses" />
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-0 overflow-auto">
                    <Hits />
                  </div>
                </div>
              </AuthRequiredInstantSearchProvider>
            </SearchStateProvider>
          </Disclosure.Panel>

          <Disclosure.Button className={classNames(
            // 13px makes it match up with the search bar menu button
            'interactive secondary absolute left-full top-6 ml-4 rounded p-[0.8125rem]',
            'duration-200',
            open && 'rotate-180',
          )}
          >
            <FaAngleDoubleRight />
          </Disclosure.Button>
        </div>
      )}
    </Disclosure>
  );
}
