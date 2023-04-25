import { useEffect, useMemo, useState } from 'react';
import { Subject } from '@/src/lib';
import type { CourseLevel } from '@/src/types';

const DATA_PATHS: Record<CourseLevel, [string, string]> = {
  undergrad: ['/tsne-undergrad.json', '/courses-undergrad.json'],
  all: ['/tsne.json', '/courses.json'],
  grad: ['/tsne-grad.json', '/courses-grad.json'],
};

export function useData(level: CourseLevel, filterSubjects?: Subject[]) {
  const [positions, setPositions] = useState<[number, number, number][] | null>(null);
  const [courses, setCourses] = useState<[string, Subject][] | null>(null);

  useEffect(() => {
    console.info('fetching data');
    const [tsnePath, coursesPath] = DATA_PATHS[level];

    fetch(tsnePath)
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
      });

    fetch(coursesPath)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
      });
  }, [level]);

  const [filteredPositions, filteredCourses] = useMemo(() => {
    if (!filterSubjects) return [positions, courses];

    if (!positions || !courses) return [null, null];

    const newPositions: typeof positions = [];
    const newCourses: typeof courses = [];

    courses.forEach(([key, subject], i) => {
      if (filterSubjects.includes(subject)) {
        newPositions.push(positions[i]);
        newCourses.push([key, subject]);
      }
    });

    return [newPositions, newCourses];
  }, [positions, courses, filterSubjects]);

  return { positions: filteredPositions, courses: filteredCourses };
}
