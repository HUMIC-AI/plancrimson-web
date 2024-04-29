import {
  useEffect, useMemo, useState,
} from 'react';
import { useRouter } from 'next/router';
import { ExtendedClass } from '../../src/lib';
import { Auth, ClassCache } from '../../src/features';
import { useAppDispatch } from '../../src/utils/hooks';
import { InfoCard, InfoCardProps } from '../Modals/InfoCard';
import { getCourseModalContent } from '../Modals/CourseCardModal';
import { useMeiliClient } from '../../src/context/meili';
import { classNames, getSubjectColor } from '../../src/utils/styles';
import { useAvailableScheduleIds } from '../../src/utils/schedules';
import { TitleComponent } from '../YearSchedule/SemesterColumn/TitleComponent';
import { EMOJI_SCALES } from './Graph';
import { LoadingBars } from '../Layout/LoadingPage';
import { useGraphContext } from '../../src/context/GraphProvider';

export function HoveredCourseInfo() {
  const { hoveredClassId: courseId, setExplanation, explanation } = useGraphContext();
  const dispatch = useAppDispatch();
  const { client, error } = useMeiliClient();
  const [course, setCourse] = useState<ExtendedClass>();

  useEffect(() => {
    if (!courseId || !client || error) {
      setCourse(undefined);
      return;
    }

    dispatch(ClassCache.loadCourses(client, [courseId]))
      .then(([response]) => {
        setCourse(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [client, courseId, dispatch, error]);

  // ensure isDialog is false and that no close button is shown
  const props = useMemo<InfoCardProps>(() => {
    if (explanation) {
      return {
        title: 'Comparing courses',
        headerContent: (
          <p className="mt-2 text-lg">
            {explanation.courses.map((c) => c.subject + c.catalog).join(' and ')}
          </p>
        ),
        content: (
          <div className="px-6 pb-64 leading-relaxed">
            {explanation.text ? (
              <p>
                {explanation.text}
              </p>
            ) : <LoadingBars />}
          </div>
        ),
        close: () => {
          setExplanation(null);
        },
        isDialog: false,
      };
    }

    if (course) {
      const { close, ...p } = getCourseModalContent(course);
      return { ...p, isDialog: false };
    }

    return {
      title: 'Hover a course to get started!',
      content: <GraphInstructions direction="column" />,
      isDialog: false,
    };
  }, [course, explanation, setExplanation]);


  return <InfoCard {...props} />;
}

export function GraphInstructions({ direction }: { direction: 'row' | 'column' }) {
  const router = useRouter();
  const userId = Auth.useAuthProperty('uid');
  const scheduleId = (router.query.scheduleId ?? null) as string | null;
  const r = 80;
  const availableScheduleIds = useAvailableScheduleIds();

  return (
    <div className={classNames(
      'flex items-center px-6 pb-6',
      direction === 'column' ? 'flex-col-reverse space-y-4' : 'flex-row space-x-4',
    )}
    >
      {/* draw an svg labelling parts of circle */}
      <svg
        className="shrink-0"
        width={r * 4}
        height={r * 3}
        viewBox={`${-r} ${-r * (3 / 2)} ${r * 5} ${r * 4}`}
        fontSize={r / 4}
        strokeWidth={2}
        stroke="rgb(var(--color-primary))"
        fill="rgb(var(--color-primary))"
      >
        <line x1={0} y1={0} x2={r * 3} y2={r * (3 / 2)} strokeOpacity={0.6} strokeLinecap="round" strokeWidth={r / 4} />

        <circle
          r={r}
          fill={getSubjectColor('COMPLIT')}
          strokeOpacity={0}
        />
        <text textAnchor="middle" dominantBaseline="central" fontSize={r}>
          {EMOJI_SCALES.meanRating[4]}
        </text>

        <line x1={r / 3} y1={-r / 3} x2={r} y2={-r / 2} />
        <text x={r} y={-r / 2}>QReport rating</text>

        <line x1={-6} y1={r / 3} x2={6} y2={r / 3} />
        <line x1={-6} y1={r} x2={6} y2={r} />
        <line x1={0} y1={r / 3} x2={0} y2={r} />
        <text dominantBaseline="central" x={r / 8} y={((r / 3) + r) / 2}>Class size</text>

        <line x1={r * (2 / 3)} y1={0} x2={r + r / 4} y2={r / 6} />
        <text x={r + r / 4} y={r / 6} dominantBaseline="central">Subject</text>

        <line x1={r * (5 / 3)} y1={r * (3 / 4)} x2={r - r / 4} y2={r + r / 3} />
        <text x={r - r / 4} y={r * (3 / 2)} dominantBaseline="central" textAnchor="middle">Click to explain relationship</text>

        <g transform={`translate(${r * 3}, ${r * (3 / 2)})`}>
          <circle
            r={r / 2}
            fill={getSubjectColor('LING')}
            strokeOpacity={0}
          />
          <text textAnchor="middle" dominantBaseline="central" fontSize={r / 2}>
            {EMOJI_SCALES.meanRating[2]}
          </text>
        </g>
      </svg>

      <ul className="list-inside list-disc space-y-2">
        <li>
          Each
          {' '}
          <strong>circle</strong>
          {' '}
          is a course.
        </li>
        <li>
          <strong>Click</strong>
          {' '}
          to browse courses.
        </li>
        <li>
          <strong>Right-click</strong>
          {' '}
          a course to focus on it.
        </li>
        <li className="text-red">
          Measures of similarity are generated by a language model and may be biased or inaccurate.
        </li>
      </ul>

      {direction === 'column' && userId && (
        <div className="mx-auto">
          <TitleComponent
            chooseSchedule={(id) => id && router.replace({
              pathname: '/explore/[scheduleId]',
              query: { scheduleId: id },
            })}
            // show currently available schedules
            idList={availableScheduleIds}
            scheduleId={scheduleId}
            showSettings={false}
            showCreate={false}
            noLink
          />
        </div>
      )}
    </div>
  );
}
