/* eslint-disable no-param-reassign */
import {
  createSlice, PayloadAction, ThunkAction,
} from '@reduxjs/toolkit';
import MeiliSearch from 'meilisearch';
import { ExtendedClass } from '../../shared/apiTypes';
import {
  getMeiliApiKey,
  getMeiliHost,
} from '../../shared/util';
import type { RootState } from '../app/store';

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
    loadClass(state, action: PayloadAction<ExtendedClass>) {
      const classData = action.payload;
      state.cache[classData.id] = classData;
    },
  },
});

// ========================= SELECTORS =========================

export const selectClassCache = (state: RootState) => state.classCache.cache;

export const loadClass = (classId: string): ThunkAction<Promise<PayloadAction<ExtendedClass>>, RootState, undefined, PayloadAction<ExtendedClass>> => async (dispatch, getState) => {
  const state = getState();
  const cache = selectClassCache(state);
  if (classId in cache) {
    return classCacheSlice.actions.loadClass(cache[classId]);
  }
  const data = await index.getDocument(classId);
  return dispatch(classCacheSlice.actions.loadClass(data));
};
