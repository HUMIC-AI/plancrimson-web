import { useModal } from '@/src/context/modal';
import { classNames } from '@/src/utils/styles';
import dynamic from 'next/dynamic';
import type { BaseSchedule } from '@/src/types';
import { PropsWithChildren } from 'react';

const DynamicCourseSearchModal = dynamic(() => import('./CourseSearchModal'));

export default function AddCoursesButton({
  schedule, className = '', children,
}: PropsWithChildren<{ schedule: BaseSchedule; className?: string; }>) {
  const { showContents } = useModal();

  return (
    <button
      type="button"
      title="Add courses"
      className={classNames(
        'flex items-center hover:bg-gray-secondary justify-center transition py-1 px-2 rounded',
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
