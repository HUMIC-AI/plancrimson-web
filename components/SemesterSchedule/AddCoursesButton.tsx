import { useModal } from '@/src/context/modal';
import { classNames } from '@/src/utils/styles';
import dynamic from 'next/dynamic';
import type { BaseSchedule } from '@/src/types';
import { PropsWithChildren } from 'react';

const DynamicCourseSearchModal = dynamic(() => import('../Modals/CourseSearchModal'));

type Props = {
  schedule: BaseSchedule;
  className?: string;
};

export default function AddCoursesButton({
  schedule, className = '', children,
}: PropsWithChildren<Props>) {
  const { showContents } = useModal();

  return (
    <button
      type="button"
      title="Add courses"
      className={classNames(
        'flex items-center justify-center button',
        className,
      )}
      onClick={() => {
        showContents({
          title: 'Add a course',
          content: <DynamicCourseSearchModal selected={schedule.id} semester={schedule} />,
        });
      }}
    >
      {children}
    </button>
  );
}
