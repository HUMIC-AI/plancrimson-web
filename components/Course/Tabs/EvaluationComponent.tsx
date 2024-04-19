import { Disclosure } from '@headlessui/react';
import React, { useMemo } from 'react';
import type { Evaluation, HoursStats } from '@/src/lib';
import { FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import {
  InstructorFeedback, OverallEvaluationDisclosure, Section,
} from './EvaluationComponents';
import Percentages from './Percentages';
import { classNames } from '../../../src/utils/styles';
import ExternalLink from '../../Utils/ExternalLink';


/**
 * Component for rendering a QReport evaluation.
 */
export function EvaluationComponent({ report: raw }: { report: Evaluation | Evaluation[]; }) {
  const {
    courseEvaluation, overall, generalComponents, multipleInstructors, hoursData, buttonTitle, reports,
  } = useEvaluationData({ report: raw });

  return (
    <Disclosure
      defaultOpen
      as="div"
      className="rounded-lg border-2 border-primary/80"
    >
      {({ open }) => (
        <>
          <Disclosure.Button
            name={buttonTitle}
            className="interactive secondary flex w-full items-center space-x-2 px-3 py-1.5 transition-colors"
          >
            <p className="flex-1 text-left font-medium">{buttonTitle}</p>

            <div className="flex items-center space-x-2">
              <ExternalLink href={courseEvaluation.url} className="interactive">
                <span className="sr-only">Open report page</span>
                <FaExternalLinkAlt title="Open report page" />
              </ExternalLink>

              <div className={classNames('interactive', open && 'transform rotate-180')}>
                <FaChevronDown />
              </div>
            </div>
          </Disclosure.Button>

          {/* scale panel height */}
          <Disclosure.Panel as="div" className="space-y-3 px-3 py-2">
            {courseEvaluation['Course Response Rate'] && (
            <p>
              {`${courseEvaluation['Course Response Rate'].invited} students total`}
            </p>
            )}

            {overall && generalComponents && (
            <OverallEvaluationDisclosure
              heading="Overall evaluation"
              visibleStats={overall}
              components={generalComponents}
            />
            )}

            {multipleInstructors ? (
              reports.map((evl) => (
                <InstructorFeedback
                  key={evl.instructorName}
                  evaluation={evl}
                />
              ))
            ) : (
              <InstructorFeedback evaluation={courseEvaluation} />
            )}

            {courseEvaluation['How strongly would you recommend this course to your peers?'] && (
            <Section title="Recommendations">
              <Percentages
                categories={courseEvaluation['How strongly would you recommend this course to your peers?'].recommendations}
              />
            </Section>
            )}

            {hoursData && (
            <Section title="Hours per week (outside of class)">
                {getHoursStatsText(hoursData)}
            </Section>
            )}

            {courseEvaluation.comments && courseEvaluation.comments.length > 0 ? (
              <Section title={`Comments (${courseEvaluation.comments.length})`}>
                <ul className="max-h-72 overflow-auto text-sm shadow-inner">
                  {courseEvaluation.comments.map((comment) => (
                    <li key={comment} className="py-0.5 even:bg-secondary/50">
                      {comment}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : (
              <p>No comments found</p>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

function useEvaluationData({ report }: { report: Evaluation | Evaluation[] }) {
  const multipleInstructors = Array.isArray(report);
  const courseEvaluation = multipleInstructors ? report[0] : report;
  const hoursData = courseEvaluation[
    'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.'
  ];

  const general = courseEvaluation['Course General Questions'];
  const [overall, generalComponents] = useMemo(() => {
    if (!general) return [null, null];
    const {
      'Evaluate the course overall.': overallEvl,
      'Assignments (exams, essays, problem sets, language homework, etc.)':
      Assignments,
      'Course materials (readings, audio-visual materials, textbooks, lab manuals, website, etc.)':
      Materials,
      'Feedback you received on work you produced in this course': Feedback,
      'Section component of the course': SectionData,
    } = general;
    return [
      overallEvl,
      {
        Assignments,
        Materials,
        Feedback,
        Section: SectionData,
      },
    ];
  }, [general]);

  const buttonTitle = `${courseEvaluation.year} ${
    courseEvaluation.season
  } — ${
    multipleInstructors
      ? 'Multiple Instructors'
      : courseEvaluation.instructorName
  }`;

  return {
    courseEvaluation,
    overall,
    generalComponents,
    multipleInstructors,
    reports: Array.isArray(report) ? report : [report],
    hoursData,
    buttonTitle,
  };
}

function getHoursStatsText(hoursData: HoursStats) {
  return (
    <div className="grid grid-flow-col grid-rows-2 place-items-center text-sm">
      <span>
        Mean:
      </span>
      <span>
        {hoursData.mean?.toFixed(2)}
      </span>
      <span>
        Median:
      </span>
      <span>
        {hoursData.median?.toFixed(2)}
      </span>
      <span>
        Mode:
      </span>
      <span>
        {hoursData.mode?.toFixed(2)}
      </span>
      <span>
        Stdev:
      </span>
      <span>
        {hoursData.stdev?.toFixed(2)}
      </span>
    </div>
  );
}
