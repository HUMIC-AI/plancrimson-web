import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirestoreError } from 'firebase/firestore';
import { useAppSelector } from '../utils/hooks';
import type { AppDispatch, RootState } from '../store';

// authentication info, not from Firestore
interface AuthInfo {
  uid: string;
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
    setAuthInfo(state, action: PayloadAction<AuthInfo | null>) {
      state.userInfo = action.payload;
    },
    setSignInError(state, action: PayloadAction<Error>) {
      state.signInError = action.payload;
    },
    setSnapshotError(state, action: PayloadAction<{ error: FirestoreError }>) {
      state.snapshotError = action.payload.error;
    },
  },
});

export const { setSignInError, setSnapshotError } = authSlice.actions;

export const setAuthInfo = (payload: AuthInfo | null) => (dispatch: AppDispatch) => {
  dispatch(authSlice.actions.setAuthInfo(payload));
};

export const useAuthProperty = (prop: keyof AuthInfo) => useAppSelector((state: RootState) => (state.auth.userInfo ? state.auth.userInfo[prop] : state.auth.userInfo));
export const selectSnapshotError = (state: RootState) => state.auth.snapshotError;

export function useSignedInOrDemo<T>(values: T, defaults: T) {
  const userId = useAuthProperty('uid');
  if (userId === null) return defaults;
  return values;
}
