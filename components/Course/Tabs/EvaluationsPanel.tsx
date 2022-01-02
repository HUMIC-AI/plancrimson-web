import { Tab } from '@headlessui/react';
import React, { useMemo } from 'react';
import useSWR from 'swr';
import { ExtendedClass, Evaluation } from '../../../shared/apiTypes';
import { Season } from '../../../shared/firestoreTypes';
import { getEvaluations, compareSemesters, getEvaluationId } from '../../../shared/util';
import EvaluationComponent from './EvaluationComponent';

const EvaluationsPanel: React.FC<{ course: ExtendedClass; }> = function ({ course }) {
  const { data: evaluations, error } = useSWR(
    course ? course.SUBJECT + course.CATALOG_NBR : null,
    getEvaluations,
  );

  if (error && error.code !== 'permission-denied') {
    console.error(error);
  }

  const allEvals = useMemo(() => {
    if (!evaluations) return null;
    const unique: (Evaluation | Evaluation[])[] = [];
    evaluations.forEach((evl) => {
      if (unique.find((e) => (Array.isArray(e)
        ? e.some((ev) => ev.url === evl.url)
        : e.url === evl.url))) return;

      // i accidentally switched year and season for the old reports
      // TODO remember to change this back after uploading data
      const [year, season]: [number, Season] = evl.year === 1
        ? [parseInt(evl.season, 10), 'Fall']
        : (evl.year === 2
          ? [parseInt(evl.season, 10) + 1, 'Spring']
          : [evl.year, evl.season]);

      const actualEvl = { ...evl, year, season };

      const keysToMatch = ['year', 'season', 'courseName'] as const;
      const foundIndex = unique.findIndex((e) => {
        if (Array.isArray(e)) {
          return e.some((ev) => keysToMatch.every((key) => ev[key] === actualEvl[key]));
        }
        return keysToMatch.every((key) => e[key] === actualEvl[key]);
      });
      if (foundIndex === -1) {
        unique.push(actualEvl);
        return;
      }
      const existingElement = unique[foundIndex];
      if (Array.isArray(existingElement)) {
        existingElement.push(actualEvl);
      } else {
        unique[foundIndex] = [existingElement, actualEvl];
      }
    });
    return unique.sort((a, b) => {
      const aa = Array.isArray(a) ? a[0] : a;
      const bb = Array.isArray(b) ? b[0] : b;
      return compareSemesters(aa, bb);
    }).reverse();
  }, [evaluations]);

  return (
    <Tab.Panel>
      {!error && !evaluations && <span>Loading...</span>}
      {error && (
        error.code === 'permission-denied'
          ? <p>Sorry, you need to be logged in to access this!</p>
          : (
            <p>
              An unexpected error occurred loading evaluations! If you&apos;re a developer, please check the logs for more information.
            </p>
          )
      )}
      {allEvals && (allEvals.length > 0 ? (
        <ul className="space-y-4">
          {allEvals.map((val) => (
            <li key={getEvaluationId(Array.isArray(val) ? val[0] : val)}>
              <EvaluationComponent report={val} />
            </li>
          ))}
        </ul>
      ) : <p>No evaluations found.</p>)}
    </Tab.Panel>
  );
};

export default EvaluationsPanel;
