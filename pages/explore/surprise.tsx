import Layout from '../../components/Layout/Layout';
import { LoadingBars } from '../../components/Layout/LoadingPage';
import { SurprisePage } from '../../components/SurprisePage/SurprisePage';
import CourseCardStyleProvider from '../../src/context/expandCards';
import { useTotalCourses } from '../../src/features/classCache';
import { useElapsed } from '../../src/utils/hooks';

/**
 * Randomly sample pairs of courses and ask which one the user prefers.
 */
export default function () {
  return (
    <Layout title="Friends" verify="meili">
      {({ userId }) => (
        <CourseCardStyleProvider defaultStyle="expanded" readonly>
          <Wrapper userId={userId} />
        </CourseCardStyleProvider>
      )}
    </Layout>
  );
}

function Wrapper({ userId }: { userId: string }) {
  const elapsed = useElapsed(500, []);
  const total = useTotalCourses();

  if (!total) {
    return elapsed ? <LoadingBars /> : null;
  }

  return <SurprisePage userId={userId} total={total} />;
}
