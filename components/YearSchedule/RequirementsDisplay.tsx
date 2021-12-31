import { Disclosure } from '@headlessui/react';
import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { classNames } from '../../shared/util';
import { RequirementsMet } from '../../src/requirements';
import { RequirementGroup } from '../../src/requirements/util';

type Props = {
  depth: number;
  requirements: RequirementGroup;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
};

const RequirementsDisplay: React.FC<Props> = function ({
  depth,
  requirements,
  validationResults,
  setHighlightedClasses,
}) {
  let Heading;
  switch (depth) {
    case 0:
      Heading = <h1 className="font-semibold text-xl">{requirements.groupId}</h1>;
      break;
    case 1:
      Heading = <h2 className="font-medium text-lg">{requirements.groupId}</h2>;
      break;
    default:
      Heading = <h3 className="font-medium">{requirements.groupId}</h3>;
  }

  return (
    <div>

      {requirements.description
        ? (
          <Disclosure>
            <Disclosure.Button as="div">
              {Heading}
            </Disclosure.Button>
            <Disclosure.Panel>
              <p>{requirements.description}</p>
            </Disclosure.Panel>
          </Disclosure>
        )
        : Heading}

      <ul className="list-decimal space-y-2 max-w-xl">
        {requirements.requirements.map((req) => {
          if ('groupId' in req) {
            return (
              <li key={req.groupId} className="ml-4">
                <RequirementsDisplay
                  depth={depth + 1}
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
              <div className={classNames(
                satisfied ? 'text-green-500' : 'text-red-500',
                'flex items-center',
              )}
              >
                <button
                  type="button"
                  onClick={() => setHighlightedClasses(classes)}
                  className="text-left"
                >
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
              </div>
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="font-medium text-gray-400 hover:text-gray-800">
                      {open ? 'Hide details' : 'Show details'}
                    </Disclosure.Button>
                    <Disclosure.Panel>
                      <p>{req.description}</p>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RequirementsDisplay;
