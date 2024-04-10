import { CourseCard } from '@/components/Course/CourseCard';
import Layout from '@/components/Layout/Layout';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import ExpandCardsProvider from '@/src/context/expandCards';
import { fetchAtOffset } from '@/src/features/classCache';
import { ExtendedClass } from '@/src/lib';
import Schema from '@/src/schema';
import { ChoiceRank } from '@/src/types';
import { alertUnexpectedError, useElapsed } from '@/src/utils/hooks';
import { arrayUnion, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

/**
 * Randomly sample pairs of courses and ask which one the user prefers.
 */
export default function () {
  return (
    <Layout title="Friends" verify="meili">
      {({ userId }) => (
        <ExpandCardsProvider defaultStyle="expanded" readonly>
          <Wrapper userId={userId} />
        </ExpandCardsProvider>
      )}
    </Layout>
  );
}

const CHOICE_KEYS: Record<number, ChoiceRank> = {
  37: -1, // left arrow key
  39: 1, // right arrow key
  32: 0, // space bar
};

function Wrapper({ userId }: { userId: string }) {
  const elapsed = useElapsed(500, []);
  const total = useTotal();

  if (!total) {
    return elapsed ? <LoadingBars /> : null;
  }

  return <SurprisePage userId={userId} total={total} />;
}

function SurprisePage({
  userId,
  total,
}: {
  userId: string;
  total: number;
}) {
  const { course1, course2, chooseSide } = useListener(userId, total);

  return (
    <div className="flex flex-col items-center">
      <h2 className="sm:my-8">
        Surprise me!
      </h2>

      <p className="mb-4 hidden sm:block">Use the left and right arrow keys to pick or spacebar to skip.</p>

      {course1 && course2 ? (
        <>
          <button
            type="button"
            className="interactive mb-4 rounded-lg bg-gray-secondary px-4 py-2"
            onClick={() => chooseSide(0)}
          >
            Skip
          </button>

          <div className="flex w-full max-w-4xl space-x-2">
            <div className="flex-1">
              <button
                type="button"
                className="interactive mb-4 w-full rounded-lg bg-gray-secondary px-4 py-2 text-2xl text-blue-primary"
                onClick={() => chooseSide(-1)}
              >
                <FaArrowLeft className="mr-auto" />
              </button>
              <CourseCard course={course1} inSearchContext={false} />
            </div>
            <div className="flex-1">
              <button
                type="button"
                className="interactive mb-4 w-full rounded-lg bg-gray-secondary px-4 py-2 text-2xl text-blue-primary"
                onClick={() => chooseSide(1)}
              >
                <FaArrowRight className="ml-auto" />
              </button>
              <CourseCard course={course2} inSearchContext={false} />
            </div>
          </div>
        </>
      ) : <LoadingBars />}
    </div>
  );
}

function useTotal() {
  const [total, setTotal] = useState<number>();
  useEffect(() => {
    fetchAtOffset(0)
      .then((res) => setTotal(res.total))
      .catch((err) => console.error(err));
  }, []);
  return total;
}

function useListener(userId: string, total: number) {
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

async function getRandomCourse(total: number) {
  const offset1 = Math.floor(Math.random() * total);
  const data = await fetchAtOffset(offset1);
  return data.results[0];
}
