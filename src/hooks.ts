import {
  MutableRefObject, useEffect, useState,
} from 'react';
import { getFirestore, DocumentReference, doc } from 'firebase/firestore';
import { ExtendedClass } from '../shared/apiTypes';
import { UserData } from '../shared/firestoreTypes';

export function getUserRef(uid: string) {
  return doc(getFirestore(), 'users', uid) as DocumentReference<UserData>;
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
    isOpen, openedCourse, handleExpand, closeModal,
  };
}

export function useIsVisible<T extends Element>(ref: MutableRefObject<T>) {
  const [isVisible, setIsVisible] = useState(false);
  const observer = typeof window !== 'undefined' ? new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
  ) : null;
  useEffect(() => {
    observer?.observe(ref.current);
    // eslint-disable-next-line consistent-return
    return () => observer?.disconnect();
  }, []);
  return isVisible;
}
