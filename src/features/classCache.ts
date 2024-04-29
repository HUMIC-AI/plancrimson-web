import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import type { ExtendedClass, IndexName } from '@/src/lib';
import { allTruthy } from '@/src/lib';
import {
  getMeiliApiKey, getMeiliHost, InstantMeiliSearchInstance, useMeiliClient,
} from '@/src/context/meili';
import { useState, useEffect } from 'react';
import type { AppDispatch, RootState } from '../store';
import { isDevelopment } from '../utils/utils';
import { useAppDispatch } from '../utils/hooks';

export interface ClassCache {
  [classId: string]: ExtendedClass;
}

export interface ClassCacheState {
  initialized: boolean;
  cache: ClassCache;
  // avoid synchronization that double loads a class
  loading: string[];
  errors: string[];
}

const initialState: ClassCacheState = {
  initialized: false,
  cache: {},
  loading: [],
  errors: [],
};

export const classCacheSlice = createSlice({
  name: 'classCache',
  initialState,
  reducers: {
    beginLoad(state, action: PayloadAction<string[]>) {
      state.loading.push(...action.payload);
    },
    addClasses(state, action: PayloadAction<ExtendedClass[]>) {
      action.payload.forEach((classData) => {
        state.cache[classData.id] = { ...classData };
      });
      const ids = action.payload.map((classData) => classData.id);
      state.loading = state.loading.filter((id) => !ids.includes(id));
      state.initialized = true;
    },
  },
});

// ========================= SELECTORS =========================

export const selectClassCache: (state: RootState) => ClassCache = (state: RootState) => state.classCache.cache;

export const selectInitialized: (state: RootState) => boolean = (state: RootState) => state.classCache.initialized;

export async function fetchAtOffset(offset: number): Promise<{
  course: ExtendedClass;
  total: number;
}> {
  const apiKey = await getMeiliApiKey();
  const response = await fetch(`${getMeiliHost()}/indexes/courses/documents?limit=1&offset=${offset}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });
  const data = await response.json();
  return {
    course: data.results[0],
    total: data.total,
  };
}

// api key is required except in development
// manually fetch the specified document from the Meilisearch index
const fetchCourse = async (cache: ClassCacheState['cache'], indexName: IndexName, classId: string, apiKey: string): Promise<ExtendedClass> => {
  if (classId in cache) {
    return cache[classId] as ExtendedClass;
  }

  const response = await fetch(
    `${getMeiliHost()}/indexes/${indexName}/documents/${classId}`,
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok && indexName !== 'archive') {
    const archive = await fetchCourse(cache, 'archive', classId, apiKey!);
    return archive;
  }

  const data: ExtendedClass = await response.json();
  return data;
};

/**
 * Load the given classes from the index into Redux.
 * @param index the Meilisearch index to get classes from
 * @param classIds the IDs of the classes to add to the Redux class cache
 *
 * Note that the latest Meilisearch client does not support the `getDocument` method.
 * We fetch the document directly from the Meilisearch API.
 * The type hint ensures that the index is accessible.
 */
export function loadCourses(
  index: InstantMeiliSearchInstance,
  classIds: string[],
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const apiKey = isDevelopment ? 'maple' : await getMeiliApiKey();

    if (!apiKey) {
      throw new Error('No Meili API key found');
    }

    // load new classes (only dispatch here)
    const original = getState().classCache;
    const newIds = classIds.filter((classId) => !(classId in original.cache) && !original.loading.includes(classId));
    if (newIds.length > 0) {
      console.debug(`fetching ${newIds.length} new classes from Meilisearch`);
      dispatch(classCacheSlice.actions.beginLoad(newIds));
      const newClasses = await Promise.all(newIds.map((classId) => fetchCourse({}, 'courses', classId, apiKey)));
      dispatch(classCacheSlice.actions.addClasses(newClasses));
    }

    // but return an array of all fetched classes
    const updated = getState().classCache.cache;
    const classes = await Promise.allSettled(classIds.map((classId) => fetchCourse(updated, 'courses', classId, apiKey)));
    const fetchedClasses = allTruthy(classes.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      console.error('error fetching classes', result.reason);
      return null;
    }));

    return fetchedClasses;
  };
}

export async function getRandomCourse(total: number) {
  const offset = Math.floor(Math.random() * total);
  const data = await fetchAtOffset(offset);
  return data.course;
}

export function useTotalCourses() {
  const [total, setTotal] = useState<number>();
  useEffect(() => {
    fetchAtOffset(0)
      .then((res) => setTotal(res.total))
      .catch((err) => console.error(err));
  }, []);
  return total;
}

export function useRandomCourse() {
  const total = useTotalCourses();
  const [course, setCourse] = useState<ExtendedClass>();
  useEffect(() => {
    // only set random course once
    if (total && !course) {
      getRandomCourse(total)
        .then((res) => setCourse(res))
        .catch((err) => console.error(err));
    }
  }, [course, total]);
  return course;
}

export function useCourse(id: string | null) {
  const [course, setCourse] = useState<ExtendedClass>();
  const dispatch = useAppDispatch();
  const { client, error } = useMeiliClient();

  useEffect(() => {
    if (!id || !client || error) {
      setCourse(undefined);
      return;
    }

    dispatch(loadCourses(client, [id]))
      .then(([response]) => {
        setCourse(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [client, id, dispatch, error]);

  return course;
}
