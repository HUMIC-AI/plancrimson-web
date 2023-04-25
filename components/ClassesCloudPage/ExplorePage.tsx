import ClassesCloudPage from '@/components/ClassesCloudPage/ClassesCloudPage';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { errorMessages } from '@/components/Layout/Layout';
import { Auth } from '@/src/features';
import {
  Subject,
  getSubjectColor, subjectNames, subjects,
} from '@/src/lib';
import { CourseLevel } from '@/src/types';
import { classNames } from '@/src/utils/styles';
import { Listbox } from '@headlessui/react';
import { useState } from 'react';
import { FaBars } from 'react-icons/fa';

export default function ExplorePage({ level }: { level: CourseLevel }) {
  const uid = Auth.useAuthProperty('uid');
  const [filterSubjects, setFilterSubjects] = useState<Subject[]>(subjectNames);

  if (!uid) {
    return (
      <ErrorPage>
        {errorMessages.unauthorized}
      </ErrorPage>
    );
  }

  return (
    <ClassesCloudPage controls="orbit" interactive level={level} filterSubjects={filterSubjects}>
      <Listbox
        as="div"
        className="absolute right-4 top-16 sm:right-12 sm:top-24"
        value={filterSubjects}
        onChange={setFilterSubjects}
        multiple
      >
        <div className="relative">
          <Listbox.Button
            title="Legend"
            className="flex items-center justify-center rounded bg-white/60 p-4 transition-colors hover:bg-gray-light"
          >
            <FaBars />
          </Listbox.Button>

          <SubjectsPanel setFilterSubjects={setFilterSubjects} />
        </div>
      </Listbox>
    </ClassesCloudPage>
  );
}

function SubjectsPanel({ setFilterSubjects }: {
  setFilterSubjects: (subjects: Subject[]) => void;
}) {
  const [subjectText, setSubjectText] = useState('');

  return (
    <Listbox.Options className="absolute right-0 w-32 rounded bg-white/40 p-1">
      <input
        type="text"
        className="mb-1 w-full rounded border border-gray-dark bg-transparent px-1 py-0.5 text-white placeholder:text-gray-light"
        placeholder="Find subject"
        value={subjectText}
        onChange={(e) => setSubjectText(e.target.value.toUpperCase())}
      />
      <div className="max-h-60 overflow-auto rounded border border-gray-dark">
        {subjectNames.filter((subject) => subject.includes(subjectText)).map((subject) => (
          <Listbox.Option
            key={subject}
            title={subjects[subject]}
            value={subject}
            style={{
              color: getSubjectColor(subject),
            }}
            className={({ selected }) => classNames(
              'select-none px-1 hover:bg-gray-dark/80 transition-colors',
              selected && 'bg-gray-light',
            )}
          >
            {subject}
          </Listbox.Option>
        ))}
      </div>
      <button
        type="button"
        className="mt-1 w-full px-1 text-left font-medium text-white transition-colors hover:bg-gray-dark/80"
        onClick={() => setFilterSubjects(subjectNames)}
      >
        Select all
      </button>
      <button
        type="button"
        className="w-full px-1 text-left font-medium text-white transition-colors hover:bg-gray-dark/80"
        onClick={() => setFilterSubjects([])}
      >
        Select none
      </button>
    </Listbox.Options>
  );
}

