/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SampleSchedule } from '../requirements/util';
import type { RootState } from '../app/store';

interface SemesterFormat {
  format: 'all' | 'selected' | 'sample' | null;
  sampleSchedule: SampleSchedule | null;
  expandCards: boolean;
  showAttributes: boolean;
}

const initialState: SemesterFormat = {
  format: 'all',
  sampleSchedule: null,
  expandCards: false,
  showAttributes: true,
};

export const semesterFormatSlice = createSlice({
  name: 'semesterFormat',
  initialState,
  reducers: {
    showAll: (state) => {
      state.format = 'all';
    },
    showSelected: (state) => {
      state.format = 'selected';
      state.sampleSchedule = null;
    },
    showSample: (state, action) => {
      state.format = 'sample';
      state.sampleSchedule = action.payload;
    },
    toggleExpand: (state) => {
      state.expandCards = !state.expandCards;
    },
    setShowAttributes: (state, action: PayloadAction<boolean>) => {
      state.showAttributes = action.payload;
    },
  },
});

export const {
  showAll, showSelected, showSample, toggleExpand, setShowAttributes,
} = semesterFormatSlice.actions;

// ========================= SELECTORS =========================

export const selectSemesterFormat = (state: RootState) => state.semesterFormat.format;
export const selectSampleSchedule = (state: RootState) => state.semesterFormat.sampleSchedule;
export const selectExpandCards = (state: RootState) => state.semesterFormat.expandCards;
export const selectShowAttributes = (state: RootState) => state.semesterFormat.showAttributes;
