import {
  Ref,
  forwardRef, useEffect, useMemo, useState,
} from 'react';
import { ExtendedClass } from '../../src/lib';
import { ClassCache } from '../../src/features';
import { useAppDispatch } from '../../src/utils/hooks';
import { InfoCard, InfoCardProps } from '../Modals/InfoCard';
import { getCourseModalContent } from '../Modals/CourseCardModal';
import { useMeiliClient } from '../../src/context/meili';

export const HoveredCourseInfo = forwardRef(({ courseId }: {
  courseId: string | null;
}, ref: Ref<HTMLDivElement>) => {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const [course, setCourse] = useState<ExtendedClass>();

  useEffect(() => {
    if (!courseId) {
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
  }, [courseId, client, dispatch]);

  const props = useMemo(() => {
    if (course) {
      return getCourseModalContent(course);
    }

    const modalProps: Partial<InfoCardProps> = {
      title: 'Hover over a course to see more information',
      headerContent: (
        <p className="mt-2">
          <strong>Click</strong>
          {' '}
          a course to browse
          {' '}
          <em>similar</em>
          {' '}
          ones. Or
          {' '}
          <strong>add opposites</strong>
          {' '}
          and see what happens!
        </p>
      ),
      content: (
        <div className="space-y-2 p-6">
          <p>
            The
            {' '}
            <strong>size</strong>
            {' '}
            of each dot indicates the typical number of students.
          </p>
          <p>
            The
            {' '}
            <strong>saturation</strong>
            {' '}
            indicates the average rating. (More saturated means higher rating!)
          </p>
          <p>
            The
            {' '}
            <strong>opacity</strong>
            {' '}
            indicates the workload. (More opaque means more work!)
          </p>
        </div>
      ),
    };

    return modalProps;
  }, [course]);

  return (
    <div className="absolute bottom-0 right-0 top-16 w-full max-w-xs md:right-4 md:max-w-sm" ref={ref}>
      <div className="absolute inset-0 overflow-auto pb-6">
        <InfoCard isDialog={false} noExit {...props} />
      </div>
    </div>
  );
});
