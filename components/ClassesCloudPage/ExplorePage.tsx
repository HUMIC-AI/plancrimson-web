import ClassesCloudPage from '@/components/ClassesCloudPage/ClassesCloudPage';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { errorMessages } from '@/components/Layout/Layout';
import { Auth } from '@/src/features';
import { CourseLevel } from '@/src/types';

export default function ExplorePage({ level }: { level: CourseLevel }) {
  const uid = Auth.useAuthProperty('uid');

  if (!uid) {
    return (
      <ErrorPage>
        {errorMessages.unauthorized}
      </ErrorPage>
    );
  }

  return <ClassesCloudPage controls="orbit" interactive level={level} />;
}
