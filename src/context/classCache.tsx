import MeiliSearch, { Index } from 'meilisearch';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import CustomDialog from '../../components/CustomDialog';
import { ExtendedClass } from '../../shared/apiTypes';
import { Schedule } from '../../shared/firestoreTypes';
import {
  getAllClassIds,
  getMeiliApiKey,
  getMeiliHost,
  throwMissingContext,
} from '../../shared/util';

export type ClassCache = Record<string, ExtendedClass>;

export type ClassCacheContextType = {
  classCache: Readonly<ClassCache>;
  appendClasses: (classIds: string[]) => void;
};

const ClassCacheContext = createContext<ClassCacheContextType>({
  classCache: {},
  appendClasses: throwMissingContext,
});

type DialogProps = {
  isOpen: boolean;
  closeDialog: () => void;
  error: string | null;
};

const ErrorDialog: React.FC<DialogProps> = function ({
  isOpen,
  closeDialog,
  error,
}) {
  return (
    <CustomDialog
      open={isOpen}
      closeModal={closeDialog}
      title="An error occurred"
    >
      <div className="bg-white">
        <p>An error occurred when loading classes:</p>
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    </CustomDialog>
  );
};

export const ClassCacheProvider: React.FC = function ({ children }) {
  const [classIndex, setClassIndex] = useState<Index<ExtendedClass> | null>(
    null,
  );
  const [classIds, setClassIds] = useState<Set<string>>(new Set());
  const [classCache, setClassCache] = useState<ClassCache>({});
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [fetchClassError, setFetchClassError] = useState<string | null>(null);

  // initialize the search client
  useEffect(() => {
    const index = new MeiliSearch({
      host: getMeiliHost(),
      apiKey: getMeiliApiKey(),
    }).index<ExtendedClass>('courses');

    setClassIndex(index);
  }, []);

  useEffect(() => {
    if (!classIndex) return;

    const promises: Promise<Record<string, ExtendedClass>>[] = [];
    classIds.forEach((id) => {
      if (classCache[id]) {
        promises.push(Promise.resolve({ [id]: classCache[id] }));
      } else {
        promises.push(
          classIndex.getDocument(id).then((doc) => ({ [id]: doc })),
        );
      }
    });

    Promise.all(promises)
      .then((results) => {
        const updatedCache = Object.assign({}, ...results);
        process.nextTick(() => setClassCache(updatedCache));
      })
      .catch((err) => setFetchClassError(err));
    // we only want to update the cache if new classes are added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIds, classIndex]);

  const appendClasses: ClassCacheContextType['appendClasses'] = useCallback(
    (newClassIds: string[]) => setClassIds((prev) => {
      newClassIds.forEach((id) => prev.add(id));
      return new Set(prev);
    }),
    [],
  );

  const context = useMemo(
    () => ({
      classCache,
      appendClasses,
    }),
    [classCache, appendClasses],
  );

  return (
    <ClassCacheContext.Provider value={context}>
      {children}
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        closeDialog={() => setIsErrorDialogOpen(false)}
        error={fetchClassError}
      />
    </ClassCacheContext.Provider>
  );
};

const useClassCache = (schedules: Schedule[]) => {
  const { appendClasses, classCache } = useContext(ClassCacheContext);
  useEffect(() => {
    const classIds = getAllClassIds(schedules);
    if (classIds.some((id) => !classCache[id])) {
      appendClasses(classIds);
    }
  }, [schedules, classCache, appendClasses]);
  return Object.freeze(classCache);
};

export default useClassCache;
