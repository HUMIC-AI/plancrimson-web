/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, PropsWithChildren, ReactNode, SetStateAction, useContext, useMemo, useState,
} from 'react';
import type { ExtendedClass } from '@/src/lib';
import { getCourseModalContent } from '@/components/Modals/CourseCardModal';

interface CustomDialogProps {
  title: string;
  headerContent?: ReactNode;
  content: ReactNode;
  small?: boolean;
  noExit?: boolean;
  close?: () => void;
}

interface ModalContextType {
  open: boolean;
  data: CustomDialogProps | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showContents: Dispatch<SetStateAction<CustomDialogProps | null>>;
  showCourse: (course: ExtendedClass) => void;
}

const ModalContext = createContext<ModalContextType>({
  open: false,
  data: null,
  setOpen: () => {},
  showContents: () => {},
  showCourse: () => {},
});

/**
 * See also CustomModal
 */
export function ModalProvider({ children }: PropsWithChildren<{}>) {
  const [open, setOpen] = useState<boolean>(false);
  const [data, setContents] = useState<CustomDialogProps | null>(null);

  const showContents: ModalContextType['showContents'] = (c) => {
    setContents(c);
    setOpen(true);
  };

  const context = useMemo(() => ({
    open,
    data,
    setOpen,
    showCourse: (course: ExtendedClass) => showContents(getCourseModalContent(course)),
    showContents,
  }), [open, data]);

  return (
    <ModalContext.Provider value={context}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
