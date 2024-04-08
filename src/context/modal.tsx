/* eslint-disable no-param-reassign */
import {
  createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState,
} from 'react';
import type { ExtendedClass } from '@/src/lib';
import { getCourseModalContent } from '@/components/Modals/CourseCardModal';
import { InfoCardProps } from '../../components/Modals/InfoCard';

interface ModalContextType {
  open: boolean;
  modalProps: InfoCardProps | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showContents: Dispatch<SetStateAction<InfoCardProps | null>>;
  showCourse: (course: ExtendedClass) => void;
}

const ModalContext = createContext<ModalContextType>({
  open: false,
  modalProps: null,
  setOpen: () => {},
  showContents: () => {},
  showCourse: () => {},
});

/**
 * See also {@link CustomModal}
 * Provides some commands for controlling the global modal.
 */
export function ModalProvider({ children }: PropsWithChildren<{}>) {
  const [open, setOpen] = useState<boolean>(false);
  const [modalProps, setModalProps] = useState<InfoCardProps | null>(null);

  const showContents: ModalContextType['showContents'] = (contents) => {
    setModalProps(contents);
    setOpen(true);
  };

  const context = useMemo(() => ({
    open,
    modalProps,
    setOpen,
    showCourse: (course: ExtendedClass) => showContents(getCourseModalContent(course)),
    showContents,
  }), [open, modalProps]);

  return (
    <ModalContext.Provider value={context}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
