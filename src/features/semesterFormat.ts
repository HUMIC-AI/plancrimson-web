import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Term } from '@/src/lib';
import type { SampleSchedule } from '../requirements/util';
import type { RootState } from '../store';

interface SemesterFormat {
  format: 'all' | 'selected' | 'sample' | null;
  sampleSchedule: SampleSchedule | null;
  showAttributes: boolean;
  showRequirements: boolean;
  hiddenIds: Record<string, boolean>;
  hiddenTerms: Record<Term, boolean>;
}

const initialState: SemesterFormat = {
  format: 'selected',
  sampleSchedule: null,
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
  showAll, showSelected, showSample, setShowAttributes, setShowReqs, setHiddenId, setHiddenTerm,
} = semesterFormatSlice.actions;

// ========================= SELECTORS =========================

export const selectSemesterFormat = (state: RootState) => state.semesterFormat.format;
export const selectSampleSchedule = (state: RootState) => state.semesterFormat.sampleSchedule;
export const selectShowAttributes = (state: RootState) => state.semesterFormat.showAttributes;
export const selectShowReqs = (state: RootState) => state.semesterFormat.showRequirements;
export const selectHiddenIds = (state: RootState) => state.semesterFormat.hiddenIds;
export const selectHiddenTerms = (state: RootState) => state.semesterFormat.hiddenTerms;
