import React, { Fragment } from 'react';
import qs from 'qs';
import { ExtendedClass } from '../../shared/apiTypes';
import { getSemester } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import Tabs from './Tabs';
import CustomDialog from '../CustomDialog';

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  course: ExtendedClass | null;
};

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

const CourseDialog: React.FC<Props> = function ({
  isOpen,
  closeModal,
  course,
}) {
  const semester = course ? getSemester(course) : null;
  return (
    <CustomDialog
      open={isOpen}
      closeModal={closeModal}
      title={
        course
          ? course.SUBJECT + course.CATALOG_NBR
          : 'An unexpected error occurred.'
      }
      headerContent={
        course && (
          <>
            <p className="text-lg font-medium my-2">{course.Title}</p>
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
        )
      }
    >
      {course && <Tabs course={course} />}
    </CustomDialog>
  );
};

export default CourseDialog;
