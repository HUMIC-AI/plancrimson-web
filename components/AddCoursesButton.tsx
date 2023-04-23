import React from 'react';
import { useModal } from '@/src/context/modal';
import { TERM_TO_SEASON } from 'plancrimson-utils';
import { classNames } from '@/src/utils/styles';
import { Schedule } from '@/src/types';
import { ModalWrapper } from './CourseSearchModal';


export default function AddCoursesButton({
  schedule, className = '', children,
}: React.PropsWithChildren<{ schedule: Schedule; className?: string; }>) {
  const { showContents } = useModal();

  return (
    <button
      type="button"
      title="Add courses"
      className={classNames(
        'items-center justify-center flex opacity-0 group-hover:opacity-100 hover:bg-gray-light transition py-2 sm:mx-6 rounded',
        className,
      )}
      onClick={() => {
        const terms = Object.keys(TERM_TO_SEASON);
        const term = terms.find((t) => TERM_TO_SEASON[t].season === schedule.season && TERM_TO_SEASON[t].year === schedule.year);
        showContents({
          title: 'Add a course',
          content: <ModalWrapper selected={schedule.id} term={term} />,
        });
      }}
    >
      {children}
    </button>
  );
}
