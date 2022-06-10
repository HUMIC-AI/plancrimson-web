import { configureStore } from '@reduxjs/toolkit';
import { classCacheSlice } from './features/classCache';
import { schedulesSlice } from './features/schedules';
import { semesterFormatSlice } from './features/semesterFormat';
import { authSlice } from './features/userAuth';
import { userProfileSlice } from './features/profile';

const store = configureStore({
  reducer: {
    semesterFormat: semesterFormatSlice.reducer,
    schedules: schedulesSlice.reducer,
    profile: userProfileSlice.reducer,
    auth: authSlice.reducer,
    classCache: classCacheSlice.reducer,
  },
  middleware(getDefaultMiddleware) {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.error'],
        ignoredPaths: ['user.snapshotError'],
      },
    });
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
