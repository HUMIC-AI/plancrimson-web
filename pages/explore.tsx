import ClassesCloudPage from '@/components/ClassesCloudPage/ClassesCloudPage';
import { Auth } from '@/src/features';

export default function ExplorePage() {
  const uid = Auth.useAuthProperty('uid');
  console.log('STARTING PAGE');
  return uid ? <ClassesCloudPage controls="orbit" interactive /> : null;
}
