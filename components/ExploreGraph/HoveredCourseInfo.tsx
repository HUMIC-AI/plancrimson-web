import {
  useEffect, useMemo, useState,
} from 'react';
import { ExtendedClass } from '../../src/lib';
import { ClassCache } from '../../src/features';
import { useAppDispatch } from '../../src/utils/hooks';
import { InfoCard, InfoCardProps } from '../Modals/InfoCard';
import { getCourseModalContent } from '../Modals/CourseCardModal';
import { useMeiliClient } from '../../src/context/meili';

export function HoveredCourseInfo({ courseId }: {
  courseId: string | null;
}) {
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
            <strong>emoji</strong>
            {' '}
            indicates the average rating.
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

  return <InfoCard isDialog={false} noExit {...props} />;
}
