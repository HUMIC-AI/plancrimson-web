import qs from 'qs';
import React, { useCallback, useState } from 'react';
import type { StateResultsProvided } from 'react-instantsearch-core';
import { connectStateResults } from 'react-instantsearch-dom';
import FadeTransition from '../FadeTransition';

const POPUP_DURATION = 1000;

export const StateResultsComponent: React.FC<
Pick<StateResultsProvided, 'searchState'>
> = function ({ searchState }) {
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
        className="underline hover:opacity-50 transition-opacity"
      >
        Copy search
      </button>
      <FadeTransition
        show={popup}
        afterEnter={() => setTimeout(() => setPopup(false), POPUP_DURATION)}
      >
        <span className="p-1 rounded shadow inline-block absolute left-full top-1/2 transform -translate-y-1/2 ml-4 bg-gray-800 text-white text-xs text-center opacity-80">
          Copied to clipboard!
        </span>
      </FadeTransition>
    </div>
  );
};

export default connectStateResults(StateResultsComponent);
