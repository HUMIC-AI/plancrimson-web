import { updateDoc, arrayUnion } from 'firebase/firestore';
import { useState, useCallback, useEffect } from 'react';
import { getRandomCourse } from '../../src/features/classCache';
import { ExtendedClass } from '../../src/lib';
import Schema from '../../src/schema';
import { ChoiceRank } from '../../src/types';
import { CHOICE_KEYS } from '../../src/utils/config';
import { alertUnexpectedError } from '../../src/utils/hooks';

export function useListener(userId: string, total: number) {
  const [queue, setQueue] = useState<[ExtendedClass, ExtendedClass][]>([]);

  const addPairToQueue = useCallback(async () => {
    const pair = await Promise.all([
      getRandomCourse(total),
      getRandomCourse(total),
    ]);

    setQueue((prev) => [...prev, pair]);
  }, [total]);

  useEffect(() => {
    const promises = [];
    for (let i = 0; i < 20; i += 1) {
      promises.push(addPairToQueue());
    }

    Promise.allSettled(promises)
      .then((results) => console.info('done loading initial batch', results))
      .catch(alertUnexpectedError);
  }, [addPairToQueue]);

  // Called when the user presses an arrow key or space bar or presses one of the top buttons.
  const chooseSide = useCallback(async (choice: ChoiceRank) => {
    setQueue((prev) => prev.slice(1));

    const [class1, class2] = queue[0];

    await updateDoc(Schema.user(userId), {
      pairwiseRankings: arrayUnion({
        class1: class1.id,
        class2: class2.id,
        choice,
      }),
    });

    await addPairToQueue();
  }, [addPairToQueue, queue, userId]);

  useEffect(() => {
    if (!queue) return;

    function handleKeyPress(event: KeyboardEvent) {
      if (event.keyCode in CHOICE_KEYS) {
        event.preventDefault();
        chooseSide(CHOICE_KEYS[event.keyCode]).catch(alertUnexpectedError);
      }
    }

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [addPairToQueue, chooseSide, queue]);

  if (queue.length === 0) {
    return {
      course1: null,
      course2: null,
      chooseSide,
    };
  }

  const [course1, course2] = queue[0];

  return {
    course1,
    course2,
    chooseSide,
  };
}


