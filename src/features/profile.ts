/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Concentration } from '@/src/lib';
import type { RootState } from '../store';
import type { UserProfile } from '../types';

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
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setBio(state, action: PayloadAction<string>) {
      state.bio = action.payload;
    },
    setDisplayName(state, action: PayloadAction<string>) {
      state.displayName = action.payload;
    },
    setPhotoUrl(state, action: PayloadAction<string | null>) {
      state.photoUrl = action.payload;
    },
    setClassYear(state, action: PayloadAction<number>) {
      state.classYear = action.payload;
    },
    setConcentrationRanking(state, action: PayloadAction<Concentration[]>) {
      state.concentrationRanking = action.payload;
    },
    signOut(state) {
      // set all the properties to null
      Object.keys(state).forEach((key) => {
        state[key as keyof UserProfile] = null;
      });
    },
  },
});

export const {
  setPhotoUrl, setUsername, setClassYear, signOut,
} = userProfileSlice.actions;

// ========================= SELECTORS =========================

export const selectPhotoUrl = (state: RootState) => state.profile.photoUrl;
export const selectUsername = (state: RootState) => state.profile.username;
export const selectClassYear = (state: RootState) => state.profile.classYear;
export const selectUserProfile = (state: RootState) => state.profile;
