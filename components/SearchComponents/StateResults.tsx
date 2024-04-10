import qs from 'qs';
import React, { useCallback, useState } from 'react';
import type { StateResultsProvided } from 'react-instantsearch-core';
import { connectStateResults } from 'react-instantsearch-dom';
import FadeTransition from '../Utils/FadeTransition';
import useClientOrDemo from './ClientOrDemo';

const POPUP_DURATION = 1000;

type Provided = Pick<StateResultsProvided, 'searchState'>;

function StateResultsComponent({ searchState = {} }: Provided) {
  const [popup, setPopup] = useState(false);

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(
      `${window.location.origin + window.location.pathname}?${qs.stringify(
        searchState,
      )}`,
    );
    setPopup(true);
  }, [searchState]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="interactive underline"
      >
        Copy search
      </button>
      <FadeTransition
        show={popup}
        afterEnter={() => setTimeout(() => setPopup(false), POPUP_DURATION)}
      >
        <span className="absolute left-full top-1/2 ml-4 inline-block -translate-y-1/2 rounded bg-black p-1 text-center text-xs text-white opacity-80 shadow">
          Copied to clipboard!
        </span>
      </FadeTransition>
    </div>
  );
}

export default function StateResults() {
  const Component = useClientOrDemo<Provided, {}>(
    connectStateResults,
    StateResultsComponent,
  );
  return <Component {...{}} />;
}
