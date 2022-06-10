import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirestoreError } from 'firebase/firestore';
import type { RootState } from '../store';

// authentication info, not from Firestore
interface AuthInfo {
  uid: string;
  photoUrl: string | null;
  email: string;
}

interface AuthState {
  userInfo: AuthInfo | null;
  signInError: Error | null;
  snapshotError: FirestoreError | null;
}

const initialState: AuthState = {
  userInfo: null,
  signInError: null,
  snapshotError: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signIn(state, action: PayloadAction<AuthInfo | null>) {
      if (action.payload !== null) {
        state.userInfo = action.payload;
      }
    },
    signOut(state) {
      state.userInfo = null;
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
  signIn, signOut, setSignInError, setSnapshotError,
} = authSlice.actions;

export const selectPhotoUrl = (state: RootState) => state.auth.userInfo?.photoUrl || null;
export const selectUserUid = (state: RootState) => state.auth.userInfo?.uid || null;
export const selectEmail = (state: RootState) => state.auth.userInfo?.email || null;
export const selectSnapshotError = (state: RootState) => state.auth.snapshotError;
