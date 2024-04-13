import { CourseCard } from '@/components/Course/CourseCard';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useListener } from './surprisePageHooks';

export function SurprisePage({
  userId, total,
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
              <CourseCard course={course1} />
            </div>
            <div className="flex-1">
              <button
                type="button"
                className="interactive mb-4 w-full rounded-lg bg-gray-secondary px-4 py-2 text-2xl text-blue-primary"
                onClick={() => chooseSide(1)}
              >
                <FaArrowRight className="ml-auto" />
              </button>
              <CourseCard course={course2} />
            </div>
          </div>
        </>
      ) : <LoadingBars />}
    </div>
  );
}
