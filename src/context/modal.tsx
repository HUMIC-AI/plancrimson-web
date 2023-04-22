/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, PropsWithChildren, ReactNode, SetStateAction, useContext, useMemo, useState,
} from 'react';
import qs from 'qs';
import type { ExtendedClass } from 'plancrimson-utils';
import { getSemester } from 'plancrimson-utils';
import CourseTabs from '@/components/Course/Tabs';
import ExternalLink from '@/components/ExternalLink';

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

  function showCourse(course: ExtendedClass) {
    const semester = course ? getSemester(course) : null;
    const title = course
      ? course.SUBJECT + course.CATALOG_NBR
      : 'An unexpected error occurred.';

    const headerContent = course && (
      <>
        <p className="my-2 text-lg font-medium">{course.Title}</p>
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
    const content = course && <CourseTabs course={course} />;
    showContents({
      title, headerContent, content,
    });
  }

  const context = useMemo(() => ({
    open,
    data,
    setOpen,
    showCourse,
    showContents,
  }), [open, data]);

  return (
    <ModalContext.Provider value={context}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
