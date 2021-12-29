import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { RequirementsMet } from '../../src/schedules';
import { RequirementGroup } from '../../src/schedules/util';
import { classNames } from '../../src/util';

type Props = {
  requirements: RequirementGroup;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
};

const RequirementsDisplay: React.FC<Props> = function ({
  requirements,
  validationResults,
  setHighlightedClasses,
}) {
  return (
    <div>
      <h1 className="font-semibold">
        {requirements.groupId}
      </h1>

      {requirements.description && <p>{requirements.description}</p>}

      <ul className="list-decimal space-y-2 max-w-xl">
        {requirements.requirements.map((req) => {
          if ('groupId' in req) {
            return (
              <li key={req.groupId} className="ml-4">
                <RequirementsDisplay
                  key={req.groupId}
                  requirements={req}
                  validationResults={validationResults}
                  setHighlightedClasses={setHighlightedClasses}
                />
              </li>
            );
          }
          const satisfied = (validationResults[req.id] && validationResults[req.id].satisfied);
          const classes = (validationResults[req.id] && validationResults[req.id].classes) || [];
          // a single requirement
          return (
            <li key={req.id} className="ml-2">
              <h2 className={classNames(
                satisfied ? 'text-green-500' : 'text-red-500',
                'flex items-center',
              )}
              >
                <button type="button" onClick={() => setHighlightedClasses(classes)}>
                  {req.id}
                </button>
                {' '}
                <span className="ml-4">
                  {satisfied
                    ? <FaCheck />
                    : <FaTimes />}
                </span>
                (
                {classes.length}
                {' '}
                classes)
              </h2>
              <p>{req.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RequirementsDisplay;
