/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../shared/firestoreTypes';
import type { RootState } from '../store';

type UserDataState = UserProfile<string>;

const initialState: UserDataState = {
  username: null,
  classYear: null,
  lastLoggedIn: null,
  concentrationRanking: null,
};

/**
 * Handles the user authentication state and base user metadata.
 */
export const userProfileSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    setClassYear(state, action: PayloadAction<number>) {
      state.classYear = action.payload;
    },
    setLastSignIn(state, action: PayloadAction<string | null>) {
      state.lastLoggedIn = action.payload;
    },
  },
});

export const { setLastSignIn, setClassYear } = userProfileSlice.actions;

// ========================= SELECTORS =========================

export const selectClassYear = (state: RootState) => state.profile.classYear;
export const selectLastLoggedIn = (state: RootState) => state.profile.lastLoggedIn;
export const selectUserProfile = (state: RootState): UserProfile<string> => ({
  username: state.profile.username,
  classYear: state.profile.classYear,
  lastLoggedIn: state.profile.lastLoggedIn,
  concentrationRanking: state.profile.concentrationRanking,
});

// customTimes: state.schedules.customTimes,
// concentrationRanking: state.user.concentrationRanking,
// selectedSchedules: state.schedules.selectedSchedules,
// waivedRequirements: state.schedules.waivedRequirements,
// hiddenScheduleIds: state.schedules.hiddenScheduleIds,
