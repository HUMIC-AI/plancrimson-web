import React, { useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Configure, InstantSearch, ToggleRefinement } from 'react-instantsearch-dom';
import type { Schedule } from '../shared/types';
import { classNames, termToSeasonMap } from '../shared/util';
import { useModal } from '../src/context/modal';
import useSearchState, { SearchStateProvider } from '../src/context/searchState';
import { ChosenScheduleContext } from '../src/context/selectedSchedule';
import { Auth } from '../src/features';
import { InstantMeiliSearchInstance, useMeiliClient } from '../src/meili';
import { errorMessages } from './Layout/Layout';
import Hits, { HitsDemo } from './SearchComponents/Hits';
import SearchBox, { SearchBoxDemo } from './SearchComponents/SearchBox';


export default function AddCoursesButton({ schedule, className = '', children = <FaPlus /> }: React.PropsWithChildren<{ schedule: Schedule, className?: string }>) {
  const { showContents } = useModal();

  return (
    <button
      type="button"
      title="Add courses"
      className={classNames('flex items-center justify-center rounded-xl bg-blue-300 interactive py-2 px-4 outline-none', className)}
      onClick={() => {
        const terms = Object.keys(termToSeasonMap);
        const term = terms.find((t) => termToSeasonMap[t].season === schedule.season && termToSeasonMap[t].year === schedule.year);
        showContents({
          title: 'Add a course',
          content: <ModalWrapper selected={schedule.id} term={term} />,
        });
      }}
    >
      {children}
    </button>
  );
}


interface ModalProps {
  client: InstantMeiliSearchInstance;
  term: string | undefined;
}

function SearchModal({ client, term }: ModalProps) {
  const { searchState, setSearchState } = useSearchState();

  return (
    <InstantSearch
      indexName="courses"
      searchClient={client}
      searchState={searchState}
      onSearchStateChange={(newState) => {
        setSearchState({ ...searchState, ...newState });
      }}
      stalledSearchDelay={500}
    >
      <Configure hitsPerPage={4} />
      {term && <div className="hidden"><ToggleRefinement attribute="STRM" label="Term" value={term} defaultRefinement /></div>}
      <div className="flex space-x-4">
        <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-300 bg-white p-6 shadow-lg">
          <SearchBox scheduleChooser={false} />
          <Hits />
        </div>
      </div>
    </InstantSearch>
  );
}


function ModalWrapper({ selected, term }: { selected: string, term: string | undefined }) {
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient();

  const context = useMemo(() => ({ chosenScheduleId: selected, chooseSchedule() { } }), [selected]);

  if (typeof userId === 'undefined') {
    return <p>Loading...</p>;
  }

  if (userId === null) {
    return (
      <div className="flex space-x-4">
        <div className="flex-1 space-y-4 rounded-lg border-2 border-gray-300 bg-white p-6 shadow-lg">
          <SearchBoxDemo />
          <HitsDemo />
        </div>
      </div>
    );
  }

  if (!client || error) {
    console.error(error);
    return <p>{errorMessages.meiliClient}</p>;
  }

  return (
    <SearchStateProvider oneCol>
      <ChosenScheduleContext.Provider value={context}>
        <SearchModal client={client} term={term} />
      </ChosenScheduleContext.Provider>
    </SearchStateProvider>
  );
}

