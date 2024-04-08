/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState,
} from 'react';
import type { ExtendedClass } from '@/src/lib';
import { getCourseModalContent } from '@/components/Modals/CourseCardModal';
import { InfoCardProps } from '../../components/Modals/InfoCard';

interface ModalContextType {
  open: boolean;
  data: InfoCardProps | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showContents: Dispatch<SetStateAction<InfoCardProps | null>>;
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
  const [data, setContents] = useState<InfoCardProps | null>(null);

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
