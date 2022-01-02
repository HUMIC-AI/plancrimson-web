import { Disclosure } from '@headlessui/react';
import React, { Fragment, useMemo } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { classNames } from '../../shared/util';
import { RequirementsMet } from '../../src/requirements';
import { RequirementGroup } from '../../src/requirements/util';
import FadeTransition from '../FadeTransition';

type Props = {
  depth: number;
  requirements: RequirementGroup;
  validationResults: RequirementsMet;
  setHighlightedClasses: React.Dispatch<React.SetStateAction<string[]>>;
};

function getNumSatisfied(group: RequirementGroup, results: RequirementsMet): {
  numSatisfied: number;
  total: number;
} {
  return group.requirements.reduce((acc, req) => {
    if ('groupId' in req) {
      const nestedResults = getNumSatisfied(req, results);
      return {
        numSatisfied: acc.numSatisfied + nestedResults.numSatisfied,
        total: acc.total + nestedResults.total,
      };
    }
    if (typeof req.validate === 'undefined') return acc;
    return {
      numSatisfied: results[req.id]?.satisfied ? acc.numSatisfied + 1 : acc.numSatisfied,
      total: acc.total + 1,
    };
  }, { numSatisfied: 0, total: 0 });
}

const RequirementsDisplay: React.FC<Props> = function ({
  depth,
  requirements: reqGroup,
  validationResults,
  setHighlightedClasses,
}) {
  const Heading: React.FC = useMemo(() => {
    switch (depth) {
      case 0:
        return function ({ children }) {
          return <h1 className="font-semibold text-2xl">{children}</h1>;
        };
        break;
      case 1:
        return function ({ children }) {
          return <h2 className="font-medium text-xl">{children}</h2>;
        };
        break;
      default:
        return function ({ children }) {
          return <h3 className="font-medium text-lg">{children}</h3>;
        };
    }
  }, [depth]);

  let color: string;
  let borderStyles: string;
  switch (depth) {
    case 0:
      color = 'bg-transparent text-black focus:bg-blue-300';
      borderStyles = '';
      break;
    case 1:
      color = 'bg-gray-800 focus:bg-blue-300';
      borderStyles = 'border-gray-800 border-4';
      break;
    case 2:
      color = 'bg-gray-600 focus:bg-blue-300';
      borderStyles = 'border-gray-600 border-2';
      break;
    default:
      color = 'bg-gray-300 focus:bg-blue-300';
      borderStyles = 'border-gray-400 border-1';
      break;
  }

  const reqCount = getNumSatisfied(reqGroup, validationResults);
  return (
    <Disclosure
      defaultOpen={depth === 0}
      as="div"
      className={classNames(
        'overflow-hidden mt-4',
        depth > 1 ? 'rounded-lg' : 'sm:rounded-lg',
        borderStyles,
      )}
    >
      <Disclosure.Button className={classNames(
        'text-left text-white p-2 w-full hover:opacity-70 transition-opacity focus:ring-white focus:outline-none',
        color,
      )}
      >
        <div className="flex justify-between items-center gap-4">
          <Heading>
            <p>
              {reqGroup.groupId}
            </p>
          </Heading>
          {reqCount.total > 0 && (
          <span>
            {reqCount.numSatisfied}
            /
            {reqCount.total}
          </span>
          )}
        </div>

        {reqGroup.subheading && (
        <p className={depth === 0 ? 'text-gray-800 text-sm' : 'text-gray-200 text-sm'}>
          {reqGroup.subheading}
        </p>
        )}
      </Disclosure.Button>
      <FadeTransition>
        <Disclosure.Panel className={depth > 0 ? 'p-2' : ''}>
          {reqGroup.description && <p className="mb-4">{reqGroup.description}</p>}

          <ul className="space-y-4 text-sm">
            {reqGroup.requirements.map((req) => {
              if ('groupId' in req) {
                return (
                  <li key={req.groupId}>
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

              const MaybeDescriptionComponent = req.description ? (
                <Disclosure>
                  {(({ open: descriptionOpen }) => (
                    <>
                      <Disclosure.Button className="font-medium text-gray-400 hover:text-gray-800">
                        {descriptionOpen ? 'Hide details' : 'Show details'}
                      </Disclosure.Button>
                      <Disclosure.Panel>
                        <p>{req.description}</p>
                      </Disclosure.Panel>
                    </>
                  ))}
                </Disclosure>
              ) : null;

              if (typeof req.validate === 'undefined') {
                return (
                  <li key={req.id} className="px-4 sm:px-0">
                    <div>{req.id}</div>
                    {MaybeDescriptionComponent}
                  </li>
                );
              }

              const satisfied = validationResults[req.id]?.satisfied || false;
              const classes = validationResults[req.id]?.classes || [];
              // a single requirement
              return (
                <li key={req.id} className="px-4 sm:px-0">
                  <div className={classNames(
                    satisfied ? 'text-green-500' : 'text-red-500',
                    'flex justify-between items-center gap-2',
                  )}
                  >
                    <button
                      type="button"
                      onClick={() => setHighlightedClasses(classes)}
                      className="text-left"
                    >
                      {req.id}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      {satisfied
                        ? <FaCheck />
                        : <FaTimes />}
                      (
                      {classes.length}
                      )
                    </span>
                  </div>
                  {MaybeDescriptionComponent}
                </li>
              );
            })}
          </ul>
        </Disclosure.Panel>
      </FadeTransition>
    </Disclosure>
  );
};

export default RequirementsDisplay;
