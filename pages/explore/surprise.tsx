import CourseCard from '@/components/Course/CourseCard';
import Layout from '@/components/Layout/Layout';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { getMeiliApiKey, getMeiliHost } from '@/src/context/meili';
import { Auth } from '@/src/features';
import { fetchAtOffset } from '@/src/features/classCache';
import { ExtendedClass } from '@/src/lib';
import Schema from '@/src/schema';
import { alertUnexpectedError, useElapsed } from '@/src/utils/hooks';
import { arrayUnion, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

/**
 * Randomly sample pairs of courses and ask which one the user prefers.
 */
export default function () {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <Layout title="Friends" />;

  return (
    <Layout title="Friends" withMeili>
      <SurprisePage userId={userId} />
    </Layout>
  );
}

function SurprisePage({ userId }: { userId: string }) {
  const [numDocuments, setNumDocuments] = useState<number | null>(null);
  const [course1, setCourse1] = useState<ExtendedClass | null>(null);
  const [course2, setCourse2] = useState<ExtendedClass | null>(null);
  const elapsed = useElapsed(500, []);

  // need to use refs for the keyboard event listener
  const numDocsRef = useRef<number | null>(null);
  const courseRef = useRef<{ course1: string; course2: string } | null>(null);

  const updateCourses = (total: number) => Promise.all([
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

  useEffect(() => {
    getMeiliApiKey()
      .then((apiKey) => fetch(`${getMeiliHost()}/indexes/courses/stats`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
      }))
      .then((response) => response.json())
      .then(({ numberOfDocuments }) => {
        setNumDocuments(numberOfDocuments);
        numDocsRef.current = numberOfDocuments;
        return updateCourses(numberOfDocuments);
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

      await updateDoc(Schema.user(userId), {
        pairwiseRankings: arrayUnion({
          class1: courseRef.current.course1,
          class2: courseRef.current.course2,
          choice,
        }),
      });

      await updateCourses(numDocsRef.current);
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
            updateCourses(numDocuments);
          }}
        >
          Surprise me!
        </button>
      </div>

      {course1 && course2 ? (
        <div className="mx-auto flex max-w-4xl space-x-4">
          <div className="w-1/2 shrink-0">
            <FaArrowLeft className="mr-auto text-4xl text-gray-secondary" />
            <CourseCard course={course1} inSearchContext={false} />
          </div>
          <div className="w-1/2 shrink-0">
            <FaArrowRight className="ml-auto text-4xl text-gray-secondary" />
            <CourseCard course={course2} inSearchContext={false} />
          </div>
        </div>
      ) : <LoadingBars />}
    </>
  );
}

function getRandomCourse(total: number) {
  const offset1 = Math.floor(Math.random() * total);
  return fetchAtOffset(offset1);
}
