import ClassesCloudPage from '@/components/ClassesCloudPage/ClassesCloudPage';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { errorMessages } from '@/components/Layout/Layout';
import { Auth } from '@/src/features';

export default function ExplorePage() {
  const uid = Auth.useAuthProperty('uid');
  return uid ? <ClassesCloudPage controls="orbit" interactive /> : <ErrorPage>
    {errorMessages.unauthorized}
  </ErrorPage>;
}
