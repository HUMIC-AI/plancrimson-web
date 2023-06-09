import CourseCard from '@/components/Course/CourseCard';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { Auth, Planner } from '@/src/features';
import { fetchAtOffset } from '@/src/features/classCache';
import { ExtendedClass } from '@/src/lib';
import Schema from '@/src/schema';
import { alertUnexpectedError, useAppDispatch, useElapsed } from '@/src/utils/hooks';
import { arrayUnion, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

/**
 * Randomly sample pairs of courses and ask which one the user prefers.
 */
export default function () {
  const userId = Auth.useAuthProperty('uid');

  if (userId === null) return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;

  if (typeof userId === 'undefined') {
    return (
      <Layout title="Friends">
        <LoadingBars />
      </Layout>
    );
  }

  return (
    <Layout title="Friends" withMeili>
      <SurprisePage userId={userId} />
    </Layout>
  );
}

function SurprisePage({ userId }: { userId: string }) {
  const dispatch = useAppDispatch();
  const [numDocuments, setNumDocuments] = useState<number | null>(null);
  const [course1, setCourse1] = useState<ExtendedClass | null>(null);
  const [course2, setCourse2] = useState<ExtendedClass | null>(null);
  const elapsed = useElapsed(500, []);

  // need to use refs for the keyboard event listener
  const numDocsRef = useRef<number | null>(null);
  const courseRef = useRef<{ course1: string; course2: string } | null>(null);

  const chooseRandomPair = (total: number) => Promise.all([
    getRandomCourse(total),
    getRandomCourse(total),
  ])
    .then(([c1, c2]) => {
      setCourse1(c1);
      setCourse2(c2);
      courseRef.current = { course1: c1.id, course2: c2.id };
    })
    .catch((err) => {
      alertUnexpectedError(err);
    });

  async function chooseSide(class1: string, class2: string, choice: -1 | 0 | 1, total: number) {
    await updateDoc(Schema.user(userId), {
      pairwiseRankings: arrayUnion({
        class1,
        class2,
        choice,
      }),
    });

    await chooseRandomPair(total);
  }

  useEffect(() => {
    dispatch(Planner.setExpand('expanded'));

    fetchAtOffset(0)
      .then(({ total }) => {
        setNumDocuments(total);
        numDocsRef.current = total;
        return chooseRandomPair(total);
      })
      .catch((err) => {
        alertUnexpectedError(err);
      });

    const handleKeyPress = async (event: KeyboardEvent) => {
      if (!courseRef.current || !numDocsRef.current) return;

      let choice: null | -1 | 0 | 1 = null;

      // left arrow key
      if (event.keyCode === 37) {
        choice = -1;
      }
      // right arrow key
      if (event.keyCode === 39) {
        choice = 1;
      }
      // space bar
      if (event.keyCode === 32) {
        choice = 0;
      }

      if (choice === null) return;

      event.preventDefault();

      await chooseSide(
        courseRef.current.course1,
        courseRef.current.course2,
        choice,
        numDocsRef.current,
      );
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!numDocuments) {
    if (elapsed) {
      return <LoadingBars />;
    }
    return null;
  }

  return (
    <>
      <div className="my-8 flex items-center justify-center">
        <button
          type="button"
          className="rounded-md px-4 py-2 text-4xl font-semibold transition-colors hover:bg-gray-secondary"
          onClick={() => {
            chooseRandomPair(numDocuments);
          }}
        >
          Surprise me!
        </button>
      </div>

      {course1 && course2 ? (
        <div className="mx-auto flex max-w-4xl space-x-4">
          <div className="w-1/2 shrink-0">
            <button type="button" className="mb-4 w-full rounded-lg p-4 text-4xl text-blue-primary hover:bg-gray-secondary">
              <FaArrowLeft className="mr-auto" />
            </button>
            <CourseCard course={course1} inSearchContext={false} />
          </div>
          <div className="w-1/2 shrink-0">
            <button type="button" className="mb-4 w-full rounded-lg p-4 text-4xl text-blue-primary hover:bg-gray-secondary">
              <FaArrowRight className="ml-auto" />
            </button>
            <CourseCard course={course2} inSearchContext={false} />
          </div>
        </div>
      ) : <LoadingBars />}
    </>
  );
}

async function getRandomCourse(total: number) {
  const offset1 = Math.floor(Math.random() * total);
  const data = await fetchAtOffset(offset1);
  return data.results[0];
}
