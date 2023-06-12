import { Disclosure } from '@headlessui/react';
import React, { useMemo } from 'react';
import { FaChevronDown, FaExternalLinkAlt } from 'react-icons/fa';
import type {
  Evaluation, EvaluationStatistics, HoursStats,
} from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import ExternalLink from '../../Utils/ExternalLink';
import FadeTransition from '../../Utils/FadeTransition';
import Tooltip from '../../Utils/Tooltip';
import Percentages from './Percentages';

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2">
      <h3>{title}</h3>
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
        <p className="text-sm text-gray-primary">
          {data.courseMean?.toFixed(2) || 'NA'}
          {' // '}
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
    <Disclosure as="div" className="rounded-lg">
      <Disclosure.Button
        name={heading}
        className="flex w-full items-center space-x-2 rounded px-2 py-1 text-left transition-colors hover:bg-gray-primary"
      >
        <h4 className="flex-1">{heading}</h4>
        {visibleStats && (
          <span className="flex items-center space-x-4">
            <span className="whitespace-nowrap">
              (
              {visibleStats.courseMean?.toFixed(2) || 'NA'}
              {' // '}
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
          'rounded flex flex-col space-y-4 p-2',
        )}
      >
        {visibleStats && (
          <Percentages categories={visibleStats.votes || null} />
        )}
        <Disclosure.Panel>
          {children}
        </Disclosure.Panel>
      </div>
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
      <div className="grid grid-cols-[auto_1fr] items-center gap-4">
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
      className="rounded-lg border-2 border-black"
    >
      {({ open }) => (
        <>
          <OpenCloseButton
            buttonTitle={buttonTitle}
            url={courseEvaluation.url}
            open={open}
          />

          <FadeTransition>
            <Disclosure.Panel as="div" className="space-y-4 p-4">
              <EvaluationBody
                courseEvaluation={courseEvaluation}
                overall={overall}
                generalComponents={generalComponents}
                multipleInstructors={multipleInstructors}
                report={Array.isArray(report) ? report : [report]}
                hoursData={hoursData}
              />
            </Disclosure.Panel>
          </FadeTransition>
        </>
      )}
    </Disclosure>
  );
}
function EvaluationBody({
  courseEvaluation,
  overall,
  generalComponents,
  multipleInstructors,
  report,
  hoursData,
}: {
  courseEvaluation: Evaluation;
  overall: EvaluationStatistics | null;
  generalComponents: Record<string, EvaluationStatistics | null> | null;
  multipleInstructors: boolean,
  report: Evaluation[],
  hoursData: HoursStats | undefined
}) {
  return (
    <>
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
          categories={courseEvaluation['How strongly would you recommend this course to your peers?']?.recommendations || null}
        />
      </Section>

      {courseEvaluation.comments
      && courseEvaluation.comments.length > 0 ? (
        <DisclosureComponent heading="Comments">
          <ul className="-m-2 max-h-72 overflow-auto">
            {courseEvaluation.comments.map((comment) => (
              <li key={comment} className="p-2 even:bg-gray-secondary">
                {comment}
              </li>
            ))}
          </ul>
        </DisclosureComponent>
        ) : (
          <p>No comments found</p>
        )}
    </>
  );
}

function OpenCloseButton({
  buttonTitle,
  url,
  open,
}: {
  buttonTitle: string, url: string, open: boolean;
}) {
  return (
    <Disclosure.Button
      name={buttonTitle}
      className={classNames(
        'w-full flex justify-between space-x-2 items-center',
        'bg-black text-white py-2 px-4',
        'hover:bg-opacity-70 transition-colors',
      )}
    >
      <h3 className="font-bold">{buttonTitle}</h3>
      <span className="flex items-center space-x-4">
        <ExternalLink href={url} className="rounded p-2 transition-colors hover:bg-gray-secondary hover:text-gray-primary">
          <span className="sr-only">Open report page</span>
          <FaExternalLinkAlt title="Open report page" />
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
  );
}

