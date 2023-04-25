import {
  getFirestore, onSnapshot, query, collection, where, FirestoreError,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Evaluation, Season, compareSemesters } from '@/src/lib';

/**
 * Fetches from Firestore all the evaluations for a given course.
 * @param courseName The name of the course to get evaluations for.
 * @returns The evaluations for a given course.
 */
function useRawEvaluations(courseName: string) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>();
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!courseName) return;

    const unsubscribe = onSnapshot(
      query(
        collection(getFirestore(), 'evaluations'),
        where('courseName', '==', courseName),
      ),
      (snapshot) => {
        setEvaluations(snapshot.docs.map((doc) => doc.data() as Evaluation));
      },
      (err) => {
        setError(err);
      },
    );

    return () => unsubscribe();
  }, [courseName]);

  return [evaluations, error] as const;
}

export function useEvaluations(courseName: string) {
  const [evaluations, error] = useRawEvaluations(courseName);
  const allEvals = useMemo(() => evaluations && getEvaluations(evaluations), [evaluations]);
  return [allEvals, error] as const;
}


const keysToMatch = ['year', 'season', 'courseName'] as const;

function getEvaluations(evaluations: Evaluation[]) {
  // basically a set of existing evaluations for this term
  const unique: (Evaluation | Evaluation[])[] = [];

  evaluations.forEach((evl) => {
    const isUnique = unique.find((e) => (
      Array.isArray(e)
        ? e.some((ev) => ev.url === evl.url)
        : e.url === evl.url
    ));

    if (isUnique) return;

    const evaluation = fixYearSeason(evl);

    const foundIndex = unique.findIndex((e) => {
      if (Array.isArray(e)) {
        return e.some((ev) => keysToMatch.every((key) => ev[key] === evaluation[key]));
      }
      return keysToMatch.every((key) => e[key] === evaluation[key]);
    });

    if (foundIndex === -1) {
      unique.push(evaluation);
      return;
    }

    const existingElement = unique[foundIndex];
    if (Array.isArray(existingElement)) {
      existingElement.push(evaluation);
    } else {
      unique[foundIndex] = [existingElement, evaluation];
    }
  });

  return unique
    .map((e) => (Array.isArray(e) ? e[0] : e))
    .sort(compareSemesters)
    .reverse();
}

function fixYearSeason(evaluation: Evaluation) {
  // i accidentally switched year and season for the old reports
  // TODO remember to change this back after uploading data
  const [year, season]: [number, Season] = evaluation.year === 1
    ? [parseInt(evaluation.season, 10), 'Fall']
    : evaluation.year === 2
      ? [parseInt(evaluation.season, 10) + 1, 'Spring']
      : [evaluation.year, evaluation.season];

  return { ...evaluation, year, season };
}
