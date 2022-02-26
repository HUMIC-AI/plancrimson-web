/* eslint-disable no-param-reassign */
import {
  ActionCreatorWithPayload, createSlice, PayloadAction, ThunkAction,
} from '@reduxjs/toolkit';
import { updateDoc } from 'firebase/firestore';
import {
  CustomTimeRecord, Schedule, ScheduleData, SEASON_ORDER, Term,
} from '../../shared/firestoreTypes';
import { allTruthy, ErrorData } from '../../shared/util';
import type { RootState } from '../app/store';
import { getUserRef } from '../hooks';
import { selectUid } from './userData';

type ScheduleState = ScheduleData & {
  errors: ErrorData[];
};

const initialState: ScheduleState = {
  schedules: {},
  selectedSchedules: {},
  customTimes: {},
  waivedRequirements: {},
  errors: [],
};

type RemoveClassesPayload = Array<{
  classId: string;
  scheduleId?: string;
}>;
export type CreateSchedulePayload = Schedule & {
  force?: boolean;
};
type RenameSchedulePayload = { oldId: string, newId: string };
type DeleteSchedulePayload = string;
type AddCoursePayload = { classId: string; scheduleId: string }[];
type CustomTimePayload = CustomTimeRecord & {
  classId: string;
};
type SelectSchedulePayload = {
  term: Term;
  scheduleId: string | null;
};

type Validator<Payload> = (state: Readonly<ScheduleState>, payload: Payload) => string[];

export const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    overwrite(state, action: PayloadAction<ScheduleData>) {
      Object.assign(state, action.payload);
    },
    create(state, action: PayloadAction<CreateSchedulePayload>) {
      const {
        id, year, season, classes = [], force = false,
      } = action.payload;
      let newScheduleId = id;
      if (force) {
        let i = 1;
        while (newScheduleId in state.schedules) {
          newScheduleId = `${id} (${i})`;
          i += 1;
        }
      }
      state.schedules[newScheduleId] = {
        id: newScheduleId,
        season,
        year,
        classes,
      };
    },
    remove(state, action: PayloadAction<RemoveClassesPayload>) {
      action.payload.forEach(({ classId, scheduleId: fromScheduleId }) => {
        if (fromScheduleId) {
          const schedule = state.schedules[fromScheduleId];
          schedule.classes = schedule.classes.filter(
            ({ classId: id }) => id !== classId,
          );
        } else {
          // remove this class from all schedules
          Object.values(state.schedules).forEach((schedule) => {
            const updatedClasses = schedule.classes.filter(
              ({ classId: id }) => id !== classId,
            );
            if (updatedClasses.length !== schedule.classes.length) {
              schedule.classes = updatedClasses;
            }
          });
        }
      });
    },
    deleteSchedule(state, action: PayloadAction<string>) {
      delete state.schedules[action.payload];
    },
    rename(state, action: PayloadAction<RenameSchedulePayload>) {
      const { oldId, newId } = action.payload;
      const {
        season, year, classes, hidden,
      } = state.schedules[oldId];
      state.schedules[newId] = {
        season, year, classes: [...classes], id: newId,
      };
      if (typeof hidden !== 'undefined') state.schedules[newId].hidden = hidden;
      Object.entries(state.selectedSchedules).forEach(([term, id]) => {
        const t: Term = `${year}${season}`;
        if (term === t && id === oldId) {
          state.selectedSchedules[t] = newId;
        }
      });
      delete state.schedules[oldId];
    },
    error(state, action: PayloadAction<ErrorData>) {
      state.errors.push(action.payload);
    },
    addCourse(state, action: PayloadAction<AddCoursePayload>) {
      action.payload.forEach(({ classId, scheduleId }) => {
        const { classes } = state.schedules[scheduleId];
        if (!classes.find(({ classId: id }) => id === classId)) {
          classes.push({ classId });
        }
      });
    },
    clearSchedule(state, action: PayloadAction<string>) {
      state.schedules[action.payload].classes = [];
    },
    customTime(state, action: PayloadAction<CustomTimePayload>) {
      const { classId, ...timeData } = action.payload;
      state.customTimes[classId] = timeData;
    },
    selectSchedule(state, action: PayloadAction<SelectSchedulePayload>) {
      const { term, scheduleId } = action.payload;
      state.selectedSchedules[term] = scheduleId;
    },
  },
});

// ========================= SELECTORS =========================

export const selectScheduleData = (state: RootState) => state.schedules;
export const selectSchedules = (state: RootState) => state.schedules.schedules;
export const selectSelectedSchedules = (state: RootState) => state.schedules.selectedSchedules;
export const selectCustomTimes = (state: RootState) => state.schedules.customTimes;
export const selectCustomTime = (state: RootState, classId: string) => state.schedules.customTimes[classId];

// ========================= ACTION CREATORS =========================

const {
  create, remove, rename, deleteSchedule: delSchedule, error,
} = schedulesSlice.actions;

export const { overwrite, customTime, clearSchedule } = schedulesSlice.actions;

const syncSchedules = (uid: string, { schedules: { errors, ...data } }: RootState) => updateDoc(
  getUserRef(uid),
  // @ts-ignore
  data,
);

type Dispatcher<Payload> = (payload: Payload & { sender?: string }) => ThunkAction<Promise<PayloadAction<Payload | ErrorData>>, RootState, undefined, PayloadAction<Payload | ErrorData>>;

const createActionCreator = <Payload>(validatePayload: Validator<Payload>, createAction: ActionCreatorWithPayload<Payload>): Dispatcher<Payload> => (payload) => async (dispatch, getState) => {
  const errors = validatePayload(getState().schedules, payload);
  if (errors.length) {
    return dispatch(error({
      sender: payload.sender,
      errors,
    }));
  }
  const result = dispatch(createAction(payload));
  const uid = selectUid(getState());
  if (uid) await syncSchedules(uid, getState());
  return result;
};

export const createSchedule = createActionCreator<CreateSchedulePayload>(
  (state, {
    id, year, season, classes = [], force = false,
  }) => {
    const errors: string[] = [];
    if (id in state.schedules && !force) {
      errors.push('schedule already exists');
    }
    if (typeof year !== 'number') {
      errors.push('year must be a valid number');
    }
    if (!(season in SEASON_ORDER)) {
      errors.push('season must be a valid season');
    }
    if (!Array.isArray(classes)) {
      errors.push('classes must be an array');
    }
    return errors;
  },
  create,
);

export const removeCourses = createActionCreator<RemoveClassesPayload>(
  () => [],
  remove,
);

export const renameSchedule = createActionCreator<RenameSchedulePayload>(
  (state, { oldId, newId }) => {
    const errors: string[] = [];
    if (!(oldId in state.schedules)) {
      errors.push('schedule not found');
    }
    if (newId in state.schedules) {
      errors.push('id taken');
    }
    if (newId.length === 0 || /\./.test(newId)) {
      errors.push('invalid id');
    }
    return errors;
  },
  rename,
);

export const deleteSchedule = createActionCreator<DeleteSchedulePayload>(
  (state, id) => {
    if (id in state.schedules) {
      return [];
    }
    return ['schedule not found'];
  },
  delSchedule,
);

export const addCourse = createActionCreator<AddCoursePayload>(
  (state, courses) => allTruthy(courses.map(({ scheduleId }) => (scheduleId in state.schedules ? null : `schedule ${scheduleId} not found`))),
  schedulesSlice.actions.addCourse,
);

export const selectSchedule = createActionCreator<SelectSchedulePayload>(
  (state, { scheduleId }) => (scheduleId && !state.schedules[scheduleId] ? ['schedule not found'] : []),
  schedulesSlice.actions.selectSchedule,
);
