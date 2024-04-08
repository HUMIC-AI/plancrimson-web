import { ExtendedClass, getSemester, Semester } from '@/src/lib';
import { getAnalytics, logEvent } from 'firebase/analytics';
import qs from 'qs';
import CourseCardTabs from '../Course/CourseCardTabs';
import ExternalLink from '../Utils/ExternalLink';
import { InfoCardProps } from './InfoCard';

export function getCourseModalContent(course: ExtendedClass): InfoCardProps {
  const semester = course ? getSemester(course) : null;

  const title = course
    ? course.SUBJECT + course.CATALOG_NBR
    : 'An unexpected error occurred.';

  const headerContent = course && <CourseHeader course={course} semester={semester} />;

  const analytics = getAnalytics();
  logEvent(analytics, 'view_course', {
    subject: course.SUBJECT,
    catalogNumber: course.CATALOG_NBR,
  });

  const content = course && <CourseCardTabs course={course} />;

  return {
    title, headerContent, content,
  };
}

function CourseHeader({ course, semester }: { course: ExtendedClass; semester: Semester | null; }) {
  return (
    <>
      <h3 className="my-2">
        {course.Title}
      </h3>

      {semester && (
        <p className="text-sm">{`${semester.season} ${semester.year}`}</p>
      )}

      <p className="text-sm">
        <ExternalLink href={getMyHarvardUrl(course)}>
          my.harvard
        </ExternalLink>
        {'  '}
        |
        {'  '}
        <ExternalLink href={course.URL_URLNAME}>Course Site</ExternalLink>
      </p>
    </>
  );
}

const keyAttrs = [
  'SUBJECT',
  'CATALOG_NBR',
  'CLASS_SECTION',
  'CLASS_NBR',
  'CRSE_ID',
  'STRM',
] as const;

const getMyHarvardUrl = (course: ExtendedClass) => `https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?${qs.stringify({
  tab: 'HU_CLASS_SEARCH',
  SearchReqJSON: JSON.stringify({
    ExcludeBracketed: true,
    SaveRecent: true,
    Facets: [],
    PageNumber: 1,
    SortOrder: ['SCORE'],
    TopN: '',
    PageSize: '',
    SearchText: keyAttrs
      .map(
        (attr) => `(${attr}:${
          // add strings except for CLASS_NBR
          attr === 'CLASS_NBR' ? course[attr] : `"${course[attr]}"`
        })`,
      )
      .join(' '),
  }),
})}`;

