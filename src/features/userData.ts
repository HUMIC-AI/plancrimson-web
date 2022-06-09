/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirestoreError } from 'firebase/firestore';
import type { UserDocument, UserMetadata } from '../../shared/firestoreTypes';
import type { RootState } from '../store';

// authentication info, not from Firestore
interface UserInfo {
  uid: string;
  photoUrl: string | null;
  email: string;
}

type UserDataState = UserMetadata<string> & {
  userInfo: UserInfo | null;
  signInError: Error | null;
  snapshotError: FirestoreError | null;
};

const initialState: UserDataState = {
  username: null,
  concentrationRanking: null,
  userInfo: null,
  classYear: null,
  lastLoggedIn: null,
  signInError: null,
  snapshotError: null,
};

/**
 * Handles the user authentication state and base user metadata.
 */
export const userDataSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    signIn(state, action: PayloadAction<UserInfo | null>) {
      if (action.payload !== null) {
        state.userInfo = action.payload;
      }
    },
    signOut(state) {
      state.userInfo = null;
    },
    setClassYear(state, action: PayloadAction<number>) {
      state.classYear = action.payload;
    },
    setLastSignIn(state, action: PayloadAction<string | null>) {
      state.lastLoggedIn = action.payload;
    },
    setSignInError(state, action: PayloadAction<Error>) {
      state.signInError = action.payload;
    },
    setSnapshotError(state, action: PayloadAction<{ error: FirestoreError }>) {
      state.snapshotError = action.payload.error;
    },
  },
});

export const {
  signIn, signOut, setLastSignIn, setSignInError, setClassYear, setSnapshotError,
} = userDataSlice.actions;

// ========================= SELECTORS =========================

export const selectPhotoUrl = (state: RootState) => state.user.userInfo?.photoUrl || null;
export const selectUserUid = (state: RootState) => state.user.userInfo?.uid || null;
export const selectEmail = (state: RootState) => state.user.userInfo?.email || null;

export const selectClassYear = (state: RootState) => state.user.classYear;
export const selectLastLoggedIn = (state: RootState) => state.user.lastLoggedIn;
export const selectSnapshotError = (state: RootState) => state.user.snapshotError;
export const selectUserDocument = (state: RootState): UserDocument<string> => ({
  username: state.user.username,
  classYear: state.user.classYear,
  lastLoggedIn: state.user.lastLoggedIn,
  customTimes: state.schedules.customTimes,
  concentrationRanking: state.user.concentrationRanking,
  selectedSchedules: state.schedules.selectedSchedules,
  waivedRequirements: state.schedules.waivedRequirements,
  hiddenScheduleIds: state.schedules.hiddenScheduleIds,
});
