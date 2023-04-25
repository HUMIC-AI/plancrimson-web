import ClassesCloudPage from '@/components/ClassesCloudPage/ClassesCloudPage';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { errorMessages } from '@/components/Layout/Layout';
import { Auth } from '@/src/features';
import {
  getSubjectColor, subjectNames, subjects,
} from '@/src/lib';
import { CourseLevel } from '@/src/types';
import { Disclosure } from '@headlessui/react';
import { FaBars } from 'react-icons/fa';

export default function ExplorePage({ level }: { level: CourseLevel }) {
  const uid = Auth.useAuthProperty('uid');

  if (!uid) {
    return (
      <ErrorPage>
        {errorMessages.unauthorized}
      </ErrorPage>
    );
  }

  return (
    <ClassesCloudPage controls="orbit" interactive level={level}>

      <Disclosure as="div" className="absolute right-12 top-24">
        {({ open }) => (
          <div className="relative">
            <Disclosure.Button title="Legend" className="flex items-center justify-center rounded bg-white/70 p-4 transition-colors hover:bg-gray-light">
              <FaBars />
            </Disclosure.Button>
            <Disclosure.Panel as="ul" className="absolute right-0 top-full mt-2 max-h-60 overflow-auto rounded bg-gray-light/80 px-2 py-1">
              {subjectNames.map((subject) => (
                <li
                  key={subject}
                  title={subjects[subject]}
                  style={{
                    color: getSubjectColor(subject),
                  }}
                >
                  {subject}
                </li>
              ))}
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </ClassesCloudPage>
  );
}
