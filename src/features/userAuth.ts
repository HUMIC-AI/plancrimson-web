import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirestoreError } from 'firebase/firestore';
import { useAppSelector } from '../hooks';
import type { AppDispatch, RootState } from '../store';
import { setPhotoUrl } from './profile';

// authentication info, not from Firestore
interface AuthInfo {
  uid: string;
  photoUrl: string | null;
  email: string;
}

interface AuthState {
  userInfo: AuthInfo | null | undefined;
  signInError: Error | null;
  snapshotError: FirestoreError | null;
}

const initialState: AuthState = {
  userInfo: undefined,
  signInError: null,
  snapshotError: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signIn(state, action: PayloadAction<AuthInfo | null>) {
      state.userInfo = action.payload;
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

export const { signOut, setSignInError, setSnapshotError } = authSlice.actions;

export const signIn = (payload: AuthInfo | null) => (dispatch: AppDispatch) => {
  if (payload?.photoUrl) dispatch(setPhotoUrl(payload.photoUrl));
  dispatch(authSlice.actions.signIn(payload));
};

export const useAuthProperty = (prop: keyof AuthInfo) => useAppSelector((state: RootState) => (state.auth.userInfo ? state.auth.userInfo[prop] : state.auth.userInfo));
export const selectSnapshotError = (state: RootState) => state.auth.snapshotError;
