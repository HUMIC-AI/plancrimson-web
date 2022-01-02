import { Dialog, Transition } from '@headlessui/react';
import MeiliSearch, { Index } from 'meilisearch';
import React, {
  createContext,
  Fragment,
  useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { ExtendedClass } from '../../shared/apiTypes';
import { UserData } from '../../shared/firestoreTypes';
import {
  getAllClassIds, getMeiliApiKey, getMeiliHost, throwMissingContext,
} from '../../shared/util';

export type ClassCache = Record<string, ExtendedClass>;

export type ClassCacheContextType = {
  getClass: (classId: string) => ExtendedClass | null;
  appendClasses: (classIds: string[]) => void;
};

const ClassCacheContext = createContext<ClassCacheContextType>({
  getClass: throwMissingContext,
  appendClasses: throwMissingContext,
});

type DialogProps = {
  isOpen: boolean;
  closeDialog: () => void;
  error: string | null
};

const ErrorDialog: React.FC<DialogProps> = function ({ isOpen, closeDialog, error }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={closeDialog}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                An error occurred when loading classes
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {error}
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-800 bg-blue-300 border border-transparent rounded-md hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  onClick={closeDialog}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export const ClassCacheProvider: React.FC = function ({ children }) {
  const [classIndex, setClassIndex] = useState<Index<ExtendedClass> | null>(null);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classCache, setClassCache] = useState<ClassCache>({});
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [fetchClassError, setFetchClassError] = useState<string | null>(null);

  useEffect(() => {
    const index = new MeiliSearch({
      host: getMeiliHost(),
      apiKey: getMeiliApiKey(),
    }).index<ExtendedClass>('courses');

    setClassIndex(index);
  }, []);

  useEffect(() => {
    if (!classIndex) return;

    Promise.all(classIds.map(async (id) => {
      if (classCache[id]) {
        return { [id]: classCache[id] };
      }
      return { [id]: await classIndex.getDocument(id) };
    }))
      .then((results) => {
        const updatedCache = Object.assign({}, ...results);
        process.nextTick(() => setClassCache(updatedCache));
      })
      .catch((err) => setFetchClassError(err));
  // we only want to update the cache if new classes are added
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIds, classIndex]);

  const getClass = useCallback((classId: string) => classCache[classId] || null, [classCache]);

  const appendClasses: ClassCacheContextType['appendClasses'] = useCallback(
    (newClassIds: string[]) => setClassIds((prev) => [...prev, ...newClassIds]),
    [],
  );

  const context = useMemo(() => ({
    getClass,
    appendClasses,
  }), [getClass, appendClasses]);

  return (
    <ClassCacheContext.Provider value={context}>
      {children}
      <ErrorDialog isOpen={isErrorDialogOpen} closeDialog={() => setIsErrorDialogOpen(false)} error={fetchClassError} />
    </ClassCacheContext.Provider>
  );
};

const useClassCache = (data: UserData) => {
  const { appendClasses, getClass } = useContext(ClassCacheContext);
  useEffect(() => appendClasses(getAllClassIds(data)), [data, appendClasses]);
  return getClass;
};

export default useClassCache;
