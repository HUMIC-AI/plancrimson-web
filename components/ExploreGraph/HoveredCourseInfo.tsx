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
    };

    return modalProps;
  }, [course]);

  return <InfoCard isDialog={false} noExit {...props} />;
}
