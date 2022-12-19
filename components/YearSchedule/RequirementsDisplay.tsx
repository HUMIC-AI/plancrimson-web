import { Disclosure } from '@headlessui/react';
import React, { Fragment, useMemo } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { classNames } from '../../shared/util';
import {
  GroupResult,
  ReqResult,
  Requirement,
  RequirementGroup,
} from '../../src/requirements/util';
import FadeTransition from '../FadeTransition';

interface HighlightedState {
  highlightRequirement: React.Dispatch<
  React.SetStateAction<Requirement | undefined>
  >;
  highlightedRequirement: Requirement | undefined;
}

const Description: React.FC<{ description: React.ReactNode }> = function ({
  description,
}) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="font-medium text-gray-300 hover:text-gray-800">
            {open ? 'Hide details' : 'Show details'}
          </Disclosure.Button>
          <Disclosure.Panel>
            <p>{description}</p>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

interface RequirementComponentProps extends HighlightedState {
  req: Requirement;
  result: ReqResult | null;
}

function RequirementComponent({
  req,
  result,
  highlightRequirement,
  highlightedRequirement,
}: RequirementComponentProps) {
  if (typeof req.validate === 'undefined') {
    return (
      <>
        <div>{req.id}</div>
        {req.description && <Description description={req.description} />}
      </>
    );
  }

  const isHighlighted = highlightedRequirement?.id === req.id;
  return (
    <>
      <div
        className={classNames(
          isHighlighted
            ? 'text-blue-500 font-bold'
            : result?.satisfied
              ? 'text-green-500'
              : 'text-red-500',
          'flex justify-between items-center space-x-2 transition-colors',
        )}
      >
        <button
          type="button"
          onClick={() => highlightRequirement(isHighlighted ? undefined : req)}
          className={classNames(
            isHighlighted ? 'font-bold' : 'font-medium',
            'text-left',
          )}
        >
          {req.id}
        </button>
        <span className="inline-flex items-center space-x-1">
          {result?.satisfied ? <FaCheck /> : <FaTimes />}
          {result?.classes && `(${result.classes.length})`}
        </span>
      </div>
      {req.description && <Description description={req.description} />}
    </>
  );
}

interface Props extends HighlightedState {
  depth: number;
  requirements: RequirementGroup;
  validationResults: GroupResult | null;
}

function countSatisfiedRequirements(result: GroupResult): [number, number] {
  return Object.values(result.childResults).reduce(
    ([count, total], reqOrGroup) => {
      const [nestedCount, nestedTotal] = reqOrGroup.type === 'group'
        ? countSatisfiedRequirements(reqOrGroup)
        : [reqOrGroup.satisfied ? 1 : 0, 1];
      return [count + nestedCount, total + nestedTotal];
    },
    [0, 0],
  );
}

const RequirementGroupComponent: React.FC<Props> = function ({
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
          return <h1 className="text-2xl font-semibold">{children}</h1>;
        };
        break;
      case 1:
        return function ({ children }) {
          return <h2 className="text-xl font-medium">{children}</h2>;
        };
        break;
      default:
        return function ({ children }) {
          return <h3 className="text-lg font-medium">{children}</h3>;
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

  const [numSatisfied, total] = validationResults
    ? countSatisfiedRequirements(validationResults)
    : [0, 0];
  return (
    <Disclosure
      defaultOpen={depth === 0}
      as="div"
      className={classNames(
        'overflow-hidden',
        depth > 0 && 'mt-4',
        depth > 1 ? 'rounded-lg' : 'sm:rounded-lg',
        borderStyles,
      )}
    >
      <Disclosure.Button
        className={classNames(
          'text-left text-white p-2 w-full hover:opacity-80 transition-opacity focus:ring-white focus:outline-none focus:bg-blue-400',
          color,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <Heading>{reqGroup.groupId}</Heading>
          {total > 0 && (
            <span className="whitespace-nowrap font-medium">
              {`${numSatisfied} / ${total}`}
            </span>
          )}
        </div>

        {reqGroup.subheading && (
          <p
            className={
              depth === 0 ? 'text-sm text-gray-800' : 'text-sm text-gray-300'
            }
          >
            {reqGroup.subheading}
          </p>
        )}
      </Disclosure.Button>
      <FadeTransition>
        <Disclosure.Panel className={depth > 0 ? 'space-y-4 p-2' : 'space-y-4'}>
          {reqGroup.description && (
            <Description description={reqGroup.description} />
          )}

          <ul className="space-y-4 text-sm">
            {reqGroup.requirements.map((req) => ('groupId' in req ? (
              <li key={req.groupId}>
                <RequirementGroupComponent
                  depth={depth + 1}
                  key={req.groupId}
                  requirements={req}
                  validationResults={
                      validationResults
                        ? (validationResults.childResults[
                          req.groupId
                        ] as GroupResult)
                        : null
                    }
                  highlightRequirement={highlightRequirement}
                  highlightedRequirement={highlightedRequirement}
                />
              </li>
            ) : (
              <li
                key={req.id}
                className={classNames(
                  depth === 0 && 'p-2 border-gray-900 border-2 rounded-md',
                )}
              >
                <RequirementComponent
                  highlightRequirement={highlightRequirement}
                  highlightedRequirement={highlightedRequirement}
                  req={req}
                  result={
                      validationResults
                        ? (validationResults.childResults[req.id] as ReqResult)
                        : null
                    }
                />
              </li>
            )))}
          </ul>
        </Disclosure.Panel>
      </FadeTransition>
    </Disclosure>
  );
};

export default RequirementGroupComponent;
