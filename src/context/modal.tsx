/* eslint-disable no-param-reassign */
import {
  createContext, PropsWithChildren, useMemo, useState,
} from 'react';
import type { ExtendedClass } from '@/src/lib';
import { getCourseModalContent } from '@/components/Modals/CourseCardModal';
import { useAssertContext } from '../utils/utils';
import { ModalProps } from '../../components/Modals/InfoCard';

/**
 * Provides a stack of modals to be displayed and low-level controls for them.
 */
function useModalContext() {
  // control open separately to avoid flickering on modal close
  const [open, setOpen] = useState(false);
  const [modalPropsStack, setModalProps] = useState<ModalProps[]>([]);

  const context = useMemo(() => {
    const showContents = (contents: ModalProps) => {
      if (open) {
        // append the contents to the history
        setModalProps((c) => [...c, contents]);
      } else {
        setModalProps([contents]);
      }
      setOpen(true);
    };

    const goBack = () => {
      if (modalPropsStack.length <= 1) {
        // don't destroy the last modal data to avoid flicker
        setOpen(false);
      } else {
        setModalProps((c) => c.slice(0, -1));
      }
    };

    const showCourse = (course: ExtendedClass) => showContents(getCourseModalContent(course));

    return {
      open,
      goBack,
      modalProps: modalPropsStack[modalPropsStack.length - 1],
      showCourse,
      showContents,
    };
  }, [modalPropsStack, open]);

  return context;
}

type ModalContextType = Readonly<ReturnType<typeof useModalContext>>;

const ModalContext = createContext<ModalContextType | null>(null);

/**
 * See also {@link CustomModal}
 * Provides some commands for controlling the global modal.
 */
export function ModalProvider({ children }: PropsWithChildren<{}>) {
  const context = useModalContext();
  return (
    <ModalContext.Provider value={context}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useAssertContext(ModalContext);
