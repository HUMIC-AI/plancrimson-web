import type { InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import type { ExtendedClass } from '@/src/lib';
import { allTruthy } from '@/src/lib';
import { getMeiliApiKey, getMeiliHost } from '@/src/context/meili';
import type { AppDispatch, RootState } from '../store';
import { isDevelopment } from '../utils/utils';

export interface ClassCache {
  [classId: string]: ExtendedClass;
}

export interface ClassCacheState {
  initialized: boolean;
  cache: ClassCache;
  errors: string[];
}

const initialState: ClassCacheState = {
  initialized: false,
  cache: {},
  errors: [],
};

export const classCacheSlice = createSlice({
  name: 'classCache',
  initialState,
  reducers: {
    loadClasses(state, action: PayloadAction<ExtendedClass[]>) {
      action.payload.forEach((classData) => {
        state.cache[classData.id] = { ...classData };
      });
      state.initialized = true;
    },
  },
});

// ========================= SELECTORS =========================

export const selectClassCache: (state: RootState) => ClassCache = (state: RootState) => state.classCache.cache;

export const selectInitialized: (state: RootState) => boolean = (state: RootState) => state.classCache.initialized;

export async function fetchAtOffset(offset: number): Promise<{
  results: [ExtendedClass];
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
  return data;
}

// api key is required except in development
// manually fetch the specified document from the Meilisearch index
const fetchCourse = async (indexName: 'courses' | 'archive', classId: string, apiKey: string): Promise<ExtendedClass> => {
  const response = await fetch(
    `${getMeiliHost()}/indexes/${indexName}/documents/${classId}`,
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });

  if (!response.ok && indexName !== 'archive') {
    const archive = await fetchCourse('archive', classId, apiKey!);
    return archive;
  }

  const data: ExtendedClass = await response.json();
  return data;
}

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
    const state = getState();
    const cache = selectClassCache(state);

    const apiKey = await getMeiliApiKey();

    if (!apiKey && !isDevelopment) {
      throw new Error('No Meili API key found');
    }

    const classes = await Promise.allSettled(classIds.map((classId) => (classId in cache
      ? Promise.resolve(cache[classId])
      : fetchCourse('courses', classId, apiKey!))));

    const fetchedClasses = allTruthy(classes.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      console.error('Error fetching classes', result.reason);
      return null;
    }));

    dispatch(classCacheSlice.actions.loadClasses(fetchedClasses));

    return fetchedClasses;
  };
}
