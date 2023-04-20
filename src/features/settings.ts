import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { updateDoc } from 'firebase/firestore';
import type { Term } from 'plancrimson-utils';
import Schema from '../schema';
import type { AppDispatch, RootState } from '../store';
import { CustomTimeRecord, UserSettings } from '../types';
import { getInitialSettings } from '../utils';

type CustomTimePayload = CustomTimeRecord & {
  classId: string;
};

type ChooseSchedulePayload = {
  term: Term;
  scheduleId: string | null;
};

const initialState = getInitialSettings();

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    overwriteSettings(state, action: PayloadAction<UserSettings>) {
      Object.assign(state, action.payload);
    },
    customTime(state, action: PayloadAction<CustomTimePayload>) {
      const { classId, ...timeData } = action.payload;
      state.customTimes[classId] = timeData;
    },
    chooseSchedule(state, action: PayloadAction<ChooseSchedulePayload>) {
      const { term, scheduleId } = action.payload;
      state.chosenSchedules[term] = scheduleId;
    },
  },
});

export const { overwriteSettings, customTime } = settingsSlice.actions;

/**
 * Get the user id from the local store.
 * If the user is not signed in, throw an error.
 * Otherwise, update the user's chosen schedule for the given term in Firestore.
 * Then update the local store accordingly.
 * @param scheduleId The id of the schedule to choose.
 * @param term The term to choose the schedule for.
 */
export const chooseSchedule = ({ scheduleId, term }: ChooseSchedulePayload) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const uid = getState().auth.userInfo?.uid;
  if (!uid) throw new Error('not signed in');
  await (updateDoc as any)(Schema.user(uid), { [`chosenSchedules.${term}`]: scheduleId });
  return dispatch(settingsSlice.actions.chooseSchedule({ scheduleId, term }));
};

export const selectChosenSchedules = (state: RootState) => state.settings.chosenSchedules;
export const selectCustomTimes = (state: RootState) => state.settings.customTimes;
export const selectCustomTime = (classId: string) => (state: RootState) => state.settings.customTimes[classId];
