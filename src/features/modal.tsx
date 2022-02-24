/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, Fragment, PropsWithChildren, ReactNode, SetStateAction, useCallback, useContext, useMemo, useState,
} from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import qs from 'qs';
import type { ExtendedClass } from '../../shared/apiTypes';
import { getSemester } from '../../shared/util';
import Tabs from '../../components/Course/Tabs';
import ExternalLink from '../../components/ExternalLink';

interface CustomDialogProps {
  title: string;
  headerContent?: ReactNode;
  content: ReactNode;
}

/**
 * Based on https://headlessui.dev/react/dialog
 */

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

  const showCourse = (course: ExtendedClass) => {
    const semester = course ? getSemester(course) : null;
    const title = course
      ? course.SUBJECT + course.CATALOG_NBR
      : 'An unexpected error occurred.';

    const headerContent = course && (
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
    );
    const content = course && <Tabs course={course} />;
    setContents({
      title, headerContent, content,
    });
  };

  const showContents: ModalContextType['showContents'] = (c) => {
    setContents(c);
    setOpen(true);
  };

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

      <Transition appear show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-40 overflow-y-auto"
          onClose={() => setOpen(false)}
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
                <div className="p-6 text-white border-none">
                  <Dialog.Title as="h3" className="text-xl font-semibold">
                    {data?.title}
                  </Dialog.Title>

                  {data?.headerContent}
                </div>

                {data?.content}

                <button
                  type="button"
                  name="Close dialog"
                  onClick={() => setOpen(false)}
                  className="absolute top-5 right-5 text-gray-800 rounded-full p-2 bg-white hover:opacity-50 transition-opacity"
                >
                  <FaTimes />
                </button>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </ModalContext.Provider>
  );
}

export default ModalContext;

export const useModal = () => useContext(ModalContext);
