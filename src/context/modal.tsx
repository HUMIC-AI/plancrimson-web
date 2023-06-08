/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, PropsWithChildren, ReactNode, SetStateAction, useContext, useMemo, useState,
} from 'react';
import qs from 'qs';
import type { ExtendedClass, Semester } from '@/src/lib';
import { getSemester } from '@/src/lib';
import CourseTabs from '@/components/Course/Tabs';
import ExternalLink from '@/components/Utils/ExternalLink';
import { getAnalytics, logEvent } from 'firebase/analytics';

interface CustomDialogProps {
  title: string;
  headerContent?: ReactNode;
  content: ReactNode;
  noExit?: boolean;
}

interface ModalContextType {
  open: boolean;
  data: CustomDialogProps | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showContents: Dispatch<SetStateAction<CustomDialogProps | null>>;
  showCourse: (course: ExtendedClass) => void;
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

const ModalContext = createContext<ModalContextType>({
  open: false,
  data: null,
  setOpen: () => {},
  showContents: () => {},
  showCourse: () => {},
});

export function ModalProvider({ children }: PropsWithChildren<{}>) {
  const [open, setOpen] = useState<boolean>(false);
  const [data, setContents] = useState<CustomDialogProps | null>(null);

  const showContents: ModalContextType['showContents'] = (c) => {
    setContents(c);
    setOpen(true);
  };

  const context = useMemo(() => ({
    open,
    data,
    setOpen,
    showCourse: (course: ExtendedClass) => showContents(getCourseModalContent(course)),
    showContents,
  }), [open, data]);

  return (
    <ModalContext.Provider value={context}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);

export function getCourseModalContent(course: ExtendedClass) {
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

  const content = course && <CourseTabs course={course} />;

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

