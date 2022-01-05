// code mostly taken from https://headlessui.dev/react/dialog
import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import qs from 'qs';
import { FaTimes } from 'react-icons/fa';
import { ExtendedClass } from '../../shared/apiTypes';
import { getSemester } from '../../shared/util';
import ExternalLink from '../ExternalLink';
import Tabs from './Tabs';

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-40 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-white bg-opacity-50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-2xl">
              {course ? (
                <>
                  {/* header */}
                  <div className="p-6 text-white border-none">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold mb-2"
                    >
                      {course.SUBJECT + course.CATALOG_NBR}
                    </Dialog.Title>

                    <p className="text-lg font-medium mb-2">{course.Title}</p>
                    {semester && (
                      <p className="text-sm">
                        {`${semester.season} ${semester.year}`}
                      </p>
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
                  </div>
                  {/* end header */}

                  <Tabs course={course} />
                </>
              ) : (
                <Dialog.Title>An unexpected error occurred.</Dialog.Title>
              )}

              <button
                type="button"
                name="Close dialog"
                onClick={closeModal}
                className="absolute top-5 right-5 text-gray-800 rounded-full p-2 bg-white hover:opacity-50 transition-opacity"
              >
                <FaTimes />
              </button>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CourseDialog;
