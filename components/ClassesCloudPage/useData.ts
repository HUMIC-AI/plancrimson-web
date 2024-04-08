import { useEffect, useMemo, useState } from 'react';
import { Subject } from '@/src/lib';
import type { CourseLevel } from '@/src/types';

const DATA_PATHS: Record<CourseLevel, {
  pca: string;
  tsne: string;
  courses: string;
}> = {
  undergrad: {
    pca: '/pca-undergrad.json',
    tsne: '/tsne-undergrad.json',
    courses: '/courses-undergrad.json',
  },
  all: {
    pca: '/pca.json',
    tsne: '/tsne.json',
    courses: '/courses.json',
  },
  grad: {
    pca: '/pca-grad.json',
    tsne: '/tsne-grad.json',
    courses: '/courses-grad.json',
  },
};

export function useCourseData(level: CourseLevel, filterSubjects?: Subject[]) {
  const [courses, setCourses] = useState<[string, Subject][] | null>(null);

  useEffect(() => {
    const coursesPath = DATA_PATHS[level].courses;

    fetch(coursesPath)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
      });
  }, [level]);

  const filteredCourses = useMemo(() => {
    if (!courses) return null;
    if (!filterSubjects) return courses.map(([id, subject], i) => ({ id, subject, i }));
    return courses
      .map(([id, subject], i) => (filterSubjects.includes(subject) ? { id, subject, i } : null!))
      .filter(Boolean);
  }, [courses, filterSubjects]);

  return filteredCourses;
}

export function useCourseEmbeddingData(level: CourseLevel, filterSubjects?: Subject[]) {
  const [positions, setPositions] = useState<[number, number, number][] | null>(null);
  const filteredCourses = useCourseData(level, filterSubjects);

  useEffect(() => {
    console.info('fetching data');
    const tsnePath = DATA_PATHS[level].tsne;

    fetch(tsnePath)
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
      });
  }, [level]);

  const filteredPositions = useMemo(() => {
    if (!filteredCourses || !positions) return null;
    return filteredCourses.map(({ i }) => positions[i]);
  }, [filteredCourses, positions]);

  return {
    positions: filteredPositions,
    courses: filteredCourses,
  };
}
