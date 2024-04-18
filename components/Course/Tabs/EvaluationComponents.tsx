import { Disclosure } from '@headlessui/react';
import React, { Fragment } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import type {
  Evaluation, EvaluationStatistics,
} from '@/src/lib';
import Tooltip from '../../Utils/Tooltip';
import Percentages from './Percentages';
import { classNames } from '../../../src/utils/styles';

type OverallEvaluationProps = DisclosureComponentProps & {
  visibleStats: EvaluationStatistics;
  components: Record<string, EvaluationStatistics | null>;
};

type DisclosureComponentProps = {
  heading: string;
  visibleStats?: EvaluationStatistics;
};

/**
 * A small disclosure header that hides its children until clicked.
 */
export function DisclosureComponent({
  heading,
  visibleStats,
  children,
}: React.PropsWithChildren<DisclosureComponentProps>) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            name={heading}
            className="interactive flex w-full items-center space-x-2 rounded pt-1 text-left focus:outline-none"
          >
            <h4 className="flex-1 leading-tight">{heading}</h4>

            {visibleStats && (
            <div className="flex items-center space-x-4">
              <MeanStats courseMean={visibleStats.courseMean} fasMean={visibleStats.fasMean} />
              <FaChevronDown className={classNames('interactive', open && 'rotate-180')} />
            </div>
            )}
          </Disclosure.Button>

          {visibleStats?.votes && (
            <Percentages categories={visibleStats.votes} />
          )}

          <Disclosure.Panel className="mt-2">
            {children}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export function OverallEvaluationDisclosure({
  components, heading, visibleStats,
}: OverallEvaluationProps) {
  return (
    <DisclosureComponent heading={heading} visibleStats={visibleStats}>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
        {Object.entries(components).map(([title, data]) => data && (
          <Fragment key={title}>
            <div className="flex flex-col text-center">
              <span className="text-sm">{title}</span>
              <MeanStats courseMean={data.courseMean} fasMean={data.fasMean} />
            </div>
            <Percentages categories={data.votes || null} />
          </Fragment>
        ))}
      </div>
    </DisclosureComponent>
  );
}

export function InstructorFeedback({
  evaluation,
}: { evaluation: Evaluation }) {
  const instructorQuestions = evaluation['General Instructor Questions'];
  if (!instructorQuestions) return null;
  const instructorOverall = instructorQuestions['Evaluate your Instructor overall.'];
  const components = {
    Lectures:
      instructorQuestions[
        'Gives effective lectures or presentations, if applicable'
      ],
    Accessible:
      instructorQuestions[
        'Is accessible outside of class (including after class, office hours, e-mail, etc.)'
      ],
    Enthusiasm:
      instructorQuestions['Generates enthusiasm for the subject matter']
      || null,
    Discussion:
      instructorQuestions[
        'Facilitates discussion and encourages participation'
      ],
    Feedback: instructorQuestions['Gives useful feedback on assignments'],
    Assignments: instructorQuestions['Returns assignments in a timely fashion'],
  };
  return (
    <OverallEvaluationDisclosure
      heading={`Instructor feedback for ${evaluation.instructorName}`}
      visibleStats={instructorOverall}
      components={components}
    />
  );
}

export function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  );
}

function MeanStats({ courseMean, fasMean }: { courseMean?: number | null; fasMean?: number | null }) {
  return (
    <span className="whitespace-nowrap text-xs">
      (
      {courseMean?.toFixed(2) ?? 'NA'}
      {' // '}
      <Tooltip text="FAS mean" direction="top">
        {fasMean?.toFixed(2) ?? 'NA'}
      </Tooltip>
      )
    </span>
  );
}
