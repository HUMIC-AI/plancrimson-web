import { Disclosure } from '@headlessui/react';
import React, { Fragment, useMemo } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { classNames } from '../../shared/util';
import { RequirementsMet } from '../../src/requirements';
import { Requirement, RequirementGroup } from '../../src/requirements/util';
import FadeTransition from '../FadeTransition';

const Description: React.FC<{ description: React.ReactNode; }> = function ({ description }) {
  return (
    <Disclosure>
      {(({ open }) => (
        <>
          <Disclosure.Button className="font-medium text-gray-300 hover:text-gray-800">
            {open ? 'Hide details' : 'Show details'}
          </Disclosure.Button>
          <Disclosure.Panel>
            <p>{description}</p>
          </Disclosure.Panel>
        </>
      ))}
    </Disclosure>
  );
};

type Props = {
  depth: number;
  requirements: RequirementGroup;
  validationResults: RequirementsMet;
  highlightRequirement: React.Dispatch<React.SetStateAction<Requirement | undefined>>;
  highlightedRequirement: Requirement | undefined;
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
  highlightRequirement,
  highlightedRequirement,
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
      color = 'bg-transparent text-black';
      borderStyles = '';
      break;
    case 1:
      color = 'bg-gray-800';
      borderStyles = 'border-gray-800 border-4';
      break;
    case 2:
      color = 'bg-gray-600';
      borderStyles = 'border-gray-600 border-2';
      break;
    default:
      color = 'bg-gray-600 bg-opacity-70';
      borderStyles = 'border-gray-300 border-1';
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
        'text-left text-white p-2 w-full hover:opacity-80 transition-opacity focus:ring-white focus:outline-none focus:bg-blue-600',
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
          <span className="min-w-max font-medium">
            {reqCount.numSatisfied}
            {' '}
            /
            {' '}
            {reqCount.total}
          </span>
          )}
        </div>

        {reqGroup.subheading && (
        <p className={depth === 0 ? 'text-gray-800 text-sm' : 'text-gray-300 text-sm'}>
          {reqGroup.subheading}
        </p>
        )}
      </Disclosure.Button>
      <FadeTransition>
        <Disclosure.Panel className={depth > 0 ? 'p-2 space-y-4' : 'space-y-4'}>
          {reqGroup.description && <Description description={reqGroup.description} />}

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
                      highlightRequirement={highlightRequirement}
                      highlightedRequirement={highlightedRequirement}
                    />
                  </li>
                );
              }

              if (typeof req.validate === 'undefined') {
                return (
                  <li key={req.id} className="px-4 sm:px-0">
                    <div>{req.id}</div>
                    {req.description && <Description description={req.description} />}
                  </li>
                );
              }

              const satisfied = validationResults[req.id]?.satisfied || false;
              const classes = validationResults[req.id]?.classes || [];
              const isHighlighted = highlightedRequirement?.id === req.id;
              // a single requirement
              return (
                <li key={req.id} className="px-4 sm:px-0">
                  <div className={classNames(
                    isHighlighted ? 'text-blue-500 font-bold'
                      : (satisfied ? 'text-green-500' : 'text-red-500'),
                    'flex justify-between items-center gap-2 transition-colors',
                  )}
                  >
                    <button
                      type="button"
                      onClick={() => highlightRequirement(isHighlighted ? undefined : req)}
                      className={classNames(isHighlighted && 'font-bold', 'text-left')}
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
                  {req.description && <Description description={req.description} />}
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
