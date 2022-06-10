/* eslint-disable no-param-reassign */
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import MeiliSearch from 'meilisearch';
import { ExtendedClass } from '../../shared/apiTypes';
import {
  allTruthy,
  getMeiliApiKey,
  getMeiliHost,
} from '../../shared/util';
import type { AppDispatch, RootState } from '../store';

export interface ClassCache {
  [classId: string]: ExtendedClass;
}

export interface ClassCacheState {
  cache: ClassCache;
  errors: string[];
}

const index = new MeiliSearch({
  host: getMeiliHost(),
  apiKey: getMeiliApiKey(),
}).index<ExtendedClass>('courses');

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

export const selectClassCache = (state: RootState) => state.classCache.cache;

// loads all classes that aren't already in the cache
export const loadCourses = (classIds: string[]) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  const cache = selectClassCache(state);
  const classes = await Promise.all(classIds.map((classId) => {
    if (classId in cache) {
      return Promise.resolve(null);
    }
    return index.getDocument(classId);
  }));
  const fetchedClasses = allTruthy(classes);
  return dispatch(classCacheSlice.actions.loadClasses(fetchedClasses));
};
