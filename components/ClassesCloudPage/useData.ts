import { useEffect, useMemo, useState } from 'react';
import { Subject } from '@/src/lib';
import type { CourseLevel } from '@/src/types';

export const DATA_FIELDS = ['pca', 'tsne'] as const;

export type DataField = typeof DATA_FIELDS[number];

const DATA_PATHS: Record<CourseLevel, Record<DataField | 'courses', string>> = {
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

export type CourseBrief = {
  i: number;
  id: string;
  subject: Subject;
  catalog: string;
  meanClassSize: number | null;
  meanHours: number | null;
  meanRating: number | null;
  meanRecommendation: number | null;
};

export function useCourseData(level: CourseLevel, filterSubjects?: Subject[]): CourseBrief[] | null {
  const [courses, setCourses] = useState<CourseBrief[] | null>(null);

  useEffect(() => {
    fetch(DATA_PATHS[level].courses)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [level]);

  const filteredCourses = useMemo(() => {
    if (!courses) return null;
    if (!filterSubjects) return courses.map((course, i) => ({ ...course, i }));
    return courses
      .map((course, i) => (filterSubjects.includes(course.subject) ? { ...course, i } : null!))
      .filter(Boolean);
  }, [courses, filterSubjects]);

  return filteredCourses;
}

export function useCourseEmbeddingData(level: CourseLevel, filterSubjects?: Subject[], dataType: DataField = 'tsne') {
  const [positions, setPositions] = useState<number[][] | null>(null);
  const filteredCourses = useCourseData(level, filterSubjects);

  useEffect(() => {
    fetch(DATA_PATHS[level][dataType])
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dataType, level]);

  const filteredPositions = useMemo(() => {
    if (!filteredCourses || !positions) return null;
    return filteredCourses.map(({ i }) => positions[i]);
  }, [filteredCourses, positions]);

  return {
    positions: filteredPositions,
    courses: filteredCourses,
  };
}
