import { Disclosure } from '@headlessui/react';
import React, { useMemo } from 'react';
import { FaChevronDown, FaExternalLinkAlt } from 'react-icons/fa';
import { Evaluation, EvaluationStatistics } from '../../../shared/apiTypes';
import { classNames } from '../../../shared/util';
import ExternalLink from '../../ExternalLink';
import FadeTransition from '../../FadeTransition';
import Tooltip from '../../Tooltip';
import Percentages from './Percentages';

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2">
      <h4 className="text-md font-bold">{title}</h4>
      {children}
    </div>
  );
}

type GridProps = {
  title: string;
  data: EvaluationStatistics | null;
};

function GridHeading({ title, data } : GridProps) {
  if (!data) return null;

  return (
    <>
      <div className="text-center">
        <p>{title}</p>
        <p className="text-sm text-gray-600">
          {data.courseMean?.toFixed(2) || 'NA'}
          {' '}
          /
          {' '}
          <Tooltip text="FAS mean" direction="bottom">
            {data.fasMean?.toFixed(2) || 'NA'}
          </Tooltip>
        </p>
      </div>
      <Percentages categories={data.votes || null} />
    </>
  );
}

type OverallEvaluationProps = DisclosureComponentProps & {
  visibleStats: EvaluationStatistics;
  components: Record<string, EvaluationStatistics | null>;
};

type DisclosureComponentProps = {
  heading: string;
  visibleStats?: EvaluationStatistics;
};

function DisclosureComponent({
  heading,
  visibleStats,
  children,
}: React.PropsWithChildren<DisclosureComponentProps>) {
  return (
    <Disclosure as="div" className="border-gray-600 border-2 rounded-lg">
      {({ open }) => (
        <>
          <Disclosure.Button
            name={heading}
            className="w-full text-left flex items-center space-x-2 bg-gray-600 py-1 px-4 text-white"
          >
            <h4 className="flex-1 text-md font-bold">{heading}</h4>
            {visibleStats && (
              <span className="flex items-center space-x-4">
                <span className="whitespace-nowrap">
                  (
                  {visibleStats.courseMean?.toFixed(2) || 'NA'}
                  {' '}
                  /
                  {' '}
                  <Tooltip text="FAS mean" direction="bottom">
                    {visibleStats.fasMean?.toFixed(2) || 'NA'}
                  </Tooltip>
                  )
                </span>
                <FaChevronDown />
              </span>
            )}
          </Disclosure.Button>
          <div
            className={classNames(
              'rounded-b flex flex-col space-y-4',
              (visibleStats || open) && 'border-2 p-2',
            )}
          >
            {visibleStats && (
              <Percentages categories={visibleStats.votes || null} />
            )}
            <Disclosure.Panel>{children}</Disclosure.Panel>
          </div>
        </>
      )}
    </Disclosure>
  );
}

const OverallEvaluation: React.FC<OverallEvaluationProps> = function ({
  components,
  heading,
  visibleStats,
}) {
  return (
    <DisclosureComponent heading={heading} visibleStats={visibleStats}>
      <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
        {Object.entries(components).map(([title, data]) => (
          <GridHeading key={title} {...{ title, data }} />
        ))}
      </div>
    </DisclosureComponent>
  );
};

const InstructorFeedback: React.FC<{ evaluation: Evaluation }> = function ({
  evaluation,
}) {
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
    <OverallEvaluation
      heading={`Instructor feedback for ${evaluation.instructorName}`}
      visibleStats={instructorOverall}
      components={components}
    />
  );
};

export default function EvaluationComponent({ report }: { report: Evaluation | Evaluation[] }) {
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

  return (
    <Disclosure
      defaultOpen
      as="div"
      className="border-gray-800 border-2 rounded-lg"
    >
      {({ open }) => (
        <>
          <Disclosure.Button
            name={buttonTitle}
            className={classNames(
              'w-full flex justify-between space-x-2 items-center',
              'bg-gray-800 text-white py-2 px-4',
              'hover:bg-opacity-70 transition-colors',
            )}
          >
            <h3 className="font-bold">{buttonTitle}</h3>
            <span className="flex items-center space-x-4">
              <ExternalLink href={courseEvaluation.url}>
                <FaExternalLinkAlt title="open report page" />
              </ExternalLink>
              <div
                className={classNames(
                  'hover:opacity-50 transition-all',
                  open && 'transform rotate-180',
                )}
              >
                <FaChevronDown />
              </div>
            </span>
          </Disclosure.Button>
          <FadeTransition>
            <Disclosure.Panel className="space-y-4 p-4">
              <p>
                {courseEvaluation['Course Response Rate']?.invited
                    || 'Unknown'}
                {' '}
                students total
              </p>

              {overall && generalComponents && (
              <OverallEvaluation
                heading="Overall evaluation"
                visibleStats={overall}
                components={generalComponents}
              />
              )}

              {multipleInstructors ? (
                report.map((evl) => (
                  <InstructorFeedback
                    key={evl.instructorName}
                    evaluation={evl}
                  />
                ))
              ) : (
                <InstructorFeedback evaluation={courseEvaluation} />
              )}

              {hoursData && (
              <Section title="Hours per week (outside of class)">
                <p>
                  Mean:
                  {' '}
                  {hoursData.mean?.toFixed(2)}
                  {' '}
                  | Median:
                  {' '}
                  {hoursData.median?.toFixed(2)}
                  {' '}
                  | Mode:
                  {' '}
                  {hoursData.mode?.toFixed(2)}
                  {' '}
                  | Stdev:
                  {' '}
                  {hoursData.stdev?.toFixed(2)}
                </p>
              </Section>
              )}

              <Section title="Recommendations">
                <Percentages
                  categories={
                      courseEvaluation[
                        'How strongly would you recommend this course to your peers?'
                      ]?.recommendations || null
                    }
                />
              </Section>

              {courseEvaluation.comments
                && courseEvaluation.comments.length > 0 ? (
                  <DisclosureComponent heading="Comments">
                    <ul className="max-h-72 -m-2 overflow-auto">
                      {courseEvaluation.comments.map((comment) => (
                        <li key={comment} className="even:bg-gray-300 p-2">
                          {comment}
                        </li>
                      ))}
                    </ul>
                  </DisclosureComponent>
                ) : (
                  <p>No comments found</p>
                )}
            </Disclosure.Panel>
          </FadeTransition>
        </>
      )}
    </Disclosure>
  );
}
