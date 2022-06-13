import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { updateDoc } from 'firebase/firestore';
import type {
  CustomTimeRecord, Term, UserSettings,
} from '../../shared/types';
import Schema from '../../shared/schema';
import type { AppDispatch, RootState } from '../store';
import { getInitialSettings } from '../../shared/util';

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

export const chooseSchedule = ({ scheduleId, term }: ChooseSchedulePayload) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const uid = getState().auth.userInfo?.uid;
  if (!uid) throw new Error('not signed in');
  // @ts-ignore
  await updateDoc(Schema.user(uid), { [`chosenSchedules.${term}`]: scheduleId });
  dispatch(settingsSlice.actions.chooseSchedule({ scheduleId, term }));
};

export const selectChosenSchedules = (state: RootState) => state.settings.chosenSchedules;
export const selectCustomTimes = (state: RootState) => state.settings.customTimes;
export const selectCustomTime = (classId: string) => (state: RootState) => state.settings.customTimes[classId];
