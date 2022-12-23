/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Term } from '../../shared/types';
import type { SampleSchedule } from '../requirements/util';
import type { RootState } from '../store';

interface SemesterFormat {
  format: 'all' | 'selected' | 'sample' | null;
  sampleSchedule: SampleSchedule | null;
  expandCards: boolean;
  showAttributes: boolean;
  showRequirements: boolean;
  hiddenIds: Record<string, boolean>;
  hiddenTerms: Record<Term, boolean>;
}

const initialState: SemesterFormat = {
  format: 'selected',
  sampleSchedule: null,
  expandCards: false,
  showAttributes: true,
  showRequirements: false,
  hiddenIds: {},
  hiddenTerms: {},
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
    setShowReqs: (state, action: PayloadAction<boolean>) => {
      state.showRequirements = action.payload;
    },
    setHiddenId: (state, action: PayloadAction<{ id: string, hidden: boolean }>) => {
      const { id, hidden } = action.payload;
      if (hidden) state.hiddenIds[id] = true;
      else delete state.hiddenIds[id];
    },
    setHiddenTerm: (state, action: PayloadAction<{ term: Term, hidden: boolean }>) => {
      const { term, hidden } = action.payload;
      if (hidden) state.hiddenTerms[term] = true;
      else delete state.hiddenTerms[term];
    },
  },
});

export const {
  showAll, showSelected, showSample, toggleExpand, setShowAttributes, setShowReqs, setHiddenId, setHiddenTerm,
} = semesterFormatSlice.actions;

// ========================= SELECTORS =========================

export const selectSemesterFormat = (state: RootState) => state.semesterFormat.format;
export const selectSampleSchedule = (state: RootState) => state.semesterFormat.sampleSchedule;
export const selectExpandCards = (state: RootState) => state.semesterFormat.expandCards;
export const selectShowAttributes = (state: RootState) => state.semesterFormat.showAttributes;
export const selectShowReqs = (state: RootState) => state.semesterFormat.showRequirements;
export const selectHiddenIds = (state: RootState) => state.semesterFormat.hiddenIds;
export const selectHiddenTerms = (state: RootState) => state.semesterFormat.hiddenTerms;