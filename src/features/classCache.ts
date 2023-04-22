/* eslint-disable no-param-reassign */
import { InstantMeiliSearchInstance } from '@meilisearch/instant-meilisearch';
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import axios from 'axios';
import type { ExtendedClass } from 'plancrimson-utils';
import { allTruthy } from 'plancrimson-utils';
import { getMeiliApiKey, getMeiliHost } from '@/src/context/meili';
import type { AppDispatch, RootState } from '../store';

export interface ClassCache {
  [classId: string]: ExtendedClass;
}

export interface ClassCacheState {
  cache: ClassCache;
  errors: string[];
}

const initialState: ClassCacheState = {
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
    },
  },
});

// ========================= SELECTORS =========================

export const selectClassCache: (state: RootState) => ClassCache = (state: RootState) => state.classCache.cache;

/**
 * Load the given classes from the index into Redux.
 * @param index the Meilisearch index to get classes from
 * @param classIds the IDs of the classes to add to the Redux class cache
 *
 * Note that the latest Meilisearch client does not support the `getDocument` method.
 * We use axios to get the document directly from the Meilisearch API.
 */
export function loadCourses(
  index: InstantMeiliSearchInstance,
  classIds: string[],
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const cache = selectClassCache(state);

    const classes = await Promise.allSettled(classIds.map(async (classId) => {
      if (classId in cache) {
        return cache[classId];
      }
      const apiKey = await getMeiliApiKey();

      // get the specified document from the Meilisearch index
      const response = await axios.get<ExtendedClass>(`${getMeiliHost()}/indexes/courses/documents/${classId}`, {
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
      });
      return response.data;
    }));

    const fetchedClasses = allTruthy(classes.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value as ExtendedClass;
      }
      console.error(result.reason);
      return null;
    }));
    dispatch(classCacheSlice.actions.loadClasses(fetchedClasses));
    return fetchedClasses;
  };
}
