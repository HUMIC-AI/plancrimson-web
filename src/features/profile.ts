/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../shared/firestoreTypes';
import type { RootState } from '../store';

const initialState: UserProfile = {
  username: null,
  bio: null,
  displayName: null,
  photoUrl: null,
  classYear: null,
  concentrationRanking: null,
};

/**
 * Handles the user authentication state and base user metadata.
 */
export const userProfileSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    setPhotoUrl(state, action: PayloadAction<string>) {
      state.photoUrl = action.payload;
    },
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setBio(state, action: PayloadAction<string>) {
      state.bio = action.payload;
    },
    setClassYear(state, action: PayloadAction<number>) {
      state.classYear = action.payload;
    },
  },
});

export const {
  setPhotoUrl, setUsername, setClassYear,
} = userProfileSlice.actions;

// ========================= SELECTORS =========================

export const selectUsername = (state: RootState) => state.profile.username;
export const selectClassYear = (state: RootState) => state.profile.classYear;
export const selectUserProfile = (state: RootState): UserProfile => state.profile;
