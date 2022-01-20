import { useEffect, useState } from 'react';
import { getFirestore, DocumentReference, doc } from 'firebase/firestore';
import { ExtendedClass } from '../shared/apiTypes';
import { UserData } from '../shared/firestoreTypes';

const LG_BREAKPOINT = 1024;

export function getUserRef(uid: string) {
  return doc(getFirestore(), 'users', uid) as DocumentReference<UserData>;
}

export function downloadJson(filename: string, data: object | string, extension = 'json') {
  if (typeof window === 'undefined') return;
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
    typeof data === 'string' ? data : JSON.stringify(data),
  )}`;
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `${filename}.${extension}`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useCourseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [openedCourse, openCourse] = useState<ExtendedClass | null>(null);

  const handleExpand = (course: ExtendedClass) => {
    openCourse(course);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openedCourse,
    handleExpand,
    closeModal,
  };
}

export function useLgBreakpoint() {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!window) return; // ignore on server

    function handleResize(this: Window) {
      setIsPast(this.innerWidth >= LG_BREAKPOINT);
    }

    setIsPast(window.innerWidth >= LG_BREAKPOINT);

    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isPast;
}
