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
      headerContent: 'Click a course to browse similar ones',
      content: (
        <div className="space-y-2 p-6">
          <p>
            The size of each dot indicates the typical number of students.
          </p>
          <p>
            The
            {' '}
            <strong>saturation</strong>
            {' '}
            indicates the mean number of hours.
          </p>
          <p>
            The
            {' '}
            <strong>opacity</strong>
            {' '}
            indicates the average rating.
          </p>
        </div>
      ),
    };

    return modalProps;
  }, [course]);

  return (
    <div className="absolute inset-y-0 right-0 max-w-xs p-2" ref={ref}>
      <InfoCard small isDialog={false} noExit {...props} />
    </div>
  );
});
