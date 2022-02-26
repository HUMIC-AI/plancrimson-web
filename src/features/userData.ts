/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirestoreError } from 'firebase/firestore';
import type { UserDocument, UserData } from '../../shared/firestoreTypes';
import type { RootState } from '../app/store';

type UserDataState = UserData<string> & {
  userInfo: UserInfo | null;
  signInError: Error | null;
  snapshotError: FirestoreError | null;
};

type UserInfo = {
  uid: string;
  photoUrl: string | null;
  email: string;
};

const initialState: UserDataState = {
  userInfo: null,
  classYear: null,
  lastLoggedIn: null,
  signInError: null,
  snapshotError: null,
};

// eslint-disable-next-line import/prefer-default-export
export const userDataSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    signIn(state, action: PayloadAction<UserInfo | null>) {
      if (action.payload !== null) {
        state.userInfo = action.payload;
      }
    },
    setLastSignIn(state, action: PayloadAction<string | null>) {
      state.lastLoggedIn = action.payload;
    },
    signInError(state, action: PayloadAction<Error>) {
      state.signInError = action.payload;
    },
    setClassYear(state, action: PayloadAction<number>) {
      state.classYear = action.payload;
    },
    setSnapshotError(state, action: PayloadAction<FirestoreError>) {
      state.snapshotError = action.payload;
    },
  },
});

export const {
  signIn, setLastSignIn, signInError, setClassYear, setSnapshotError,
} = userDataSlice.actions;

// ========================= SELECTORS =========================

export const selectPhotoUrl = (state: RootState) => state.user.userInfo?.photoUrl || null;
export const selectUid = (state: RootState) => state.user.userInfo?.uid || null;
export const selectClassYear = (state: RootState) => state.user.classYear;
export const selectLastLoggedIn = (state: RootState) => state.user.lastLoggedIn;
export const selectUserDocument = (state: RootState): UserDocument<string> => ({
  classYear: state.user.classYear,
  lastLoggedIn: state.user.lastLoggedIn,
  customTimes: state.schedules.customTimes,
  schedules: state.schedules.schedules,
  selectedSchedules: state.schedules.selectedSchedules,
  waivedRequirements: state.schedules.waivedRequirements,
});
