/* eslint-disable no-param-reassign */
import {
  ActionCreatorWithPayload, createSlice, PayloadAction, ThunkAction,
} from '@reduxjs/toolkit';
import {
  onSnapshot, query, QueryConstraint, setDoc, updateDoc,
} from 'firebase/firestore';
import { useEffect } from 'react';
import {
  CustomTimeRecord, Schedule, ScheduleMetadata, ScheduleMap, SEASON_ORDER, Term,
} from '../../shared/firestoreTypes';
import { allTruthy, ErrorData } from '../../shared/util';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import { getScheduleRef, getSchedulesRef, getUserRef } from '../hooks';
import * as ClassCache from './classCache';
import { selectUserUid, setSnapshotError } from './userData';

type SchedulesState = ScheduleMetadata & {
  schedules: ScheduleMap,
  errors: ErrorData[];
};

const initialState: SchedulesState = {
  schedules: {},
  selectedSchedules: {},
  customTimes: {},
  waivedRequirements: {},
  errors: [],
  hidden: [],
};

// Payloads for the various actions
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

export const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    /**
     * Overwrite the existing schedule metadata.
     * @param action The new state to overwrite with, typically from Firestore.
     */
    overwriteScheduleMetadata(state, action: PayloadAction<ScheduleMetadata>) {
      Object.assign(state, action.payload);
    },

    overwriteSchedules(state, action: PayloadAction<ScheduleMap>) {
      Object.assign(state.schedules, action.payload);
    },

    /**
     * Create a new schedule locally.
     * Automatically increments the id to avoid collisions.
     */
    create(state, action: PayloadAction<CreateSchedulePayload>) {
      const {
        uid, id, force = false, ...data
      } = action.payload;
      let newScheduleId = id;
      if (force) {
        let i = 1;
        while (newScheduleId in state.schedules) {
          newScheduleId = `${id} (${i})`;
          i += 1;
        }
      }
      state.schedules[uid] = {
        uid,
        id: newScheduleId,
        ...data,
      };
    },

    /**
     * Remove a schedule locally.
     * @param action The class to remove and the schedule to remove it from.
     * (If omitted, will remove from all schedules.)
     */
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

    /**
     * Deletes a schedule.
     * @param action The id of the schedule to delete.
     */
    deleteSchedule(state, action: PayloadAction<string>) {
      delete state.schedules[action.payload];
    },

    /**
     * Rename a schedule.
     * @param action The old and new schedule titles.
     */
    rename(state, action: PayloadAction<RenameSchedulePayload>) {
      const { oldId, newId } = action.payload;
      const { classes, id, ...data } = state.schedules[oldId];
      state.schedules[newId] = {
        classes: [...classes], id: newId, ...data,
      };
      Object.entries(state.selectedSchedules).forEach(([term, scheduleId]) => {
        const t: Term = `${data.year}${data.season}`;
        if (term === t && scheduleId === oldId) {
          state.selectedSchedules[t] = newId;
        }
      });
      delete state.schedules[oldId];
    },

    /**
     * Toggles whether or not a given schedule is hidden.
     * @param action The uid of the schedule to toggle.
     */
    toggleHidden(state, action: PayloadAction<string>) {
      const index = state.hidden.indexOf(action.payload);
      if (index === -1) state.hidden.push(action.payload);
      else state.hidden.splice(index, 1);
    },

    /**
     * Add an error to the state.
     * @param action The error to add
     */
    error(state, action: PayloadAction<ErrorData>) {
      state.errors.push(action.payload);
    },

    /**
     * Adds a course to a schedule.
     * @param action A list of tuples,
     * each containing the class uid and the uid of the schedule to add it to.
     */
    addCourse(state, action: PayloadAction<AddCoursePayload>) {
      action.payload.forEach(({ classId, scheduleId }) => {
        const { classes } = state.schedules[scheduleId];
        if (!classes.find(({ classId: id }) => id === classId)) {
          classes.push({ classId });
        }
      });
    },

    /**
     * Remove all classes from a schedule.
     * @param action the uid of the schedule to clear.
     */
    clearSchedule(state, action: PayloadAction<string>) {
      state.schedules[action.payload].classes.length = 0;
    },

    /**
     * Lets a user input a custom time for a given class.
     * @param action See {@link CustomTimePayload}
     */
    customTime(state, action: PayloadAction<CustomTimePayload>) {
      const { classId, ...timeData } = action.payload;
      state.customTimes[classId] = timeData;
    },

    /**
     * A user selects a given schedule for a given term.
     * @param action The term and the schedule to select for that term.
     */
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
export const selectHiddenSchedules = (state: RootState) => state.schedules.hidden;
export const selectCustomTimes = (state: RootState) => state.schedules.customTimes;
export const selectCustomTime = (state: RootState, classId: string) => state.schedules.customTimes[classId];

// ========================= ACTION CREATORS =========================

const {
  overwriteSchedules, create, remove, rename, deleteSchedule: delSchedule, error,
} = schedulesSlice.actions;

export const { overwriteScheduleMetadata, customTime, clearSchedule } = schedulesSlice.actions;

/**
 * Uploads the entire local state to Firestore.
 * @param uid user uid
 * @param schedules the entire state. We exclude `errors` and `schedules` to return only the metadata.
 */
const syncSchedules = (uid: string, { schedules, errors, ...metadata }: SchedulesState) => Promise.all([
  updateDoc(
    getUserRef(uid),
    // @ts-ignore
    metadata,
  ),
  Promise.all(Object.entries(schedules).map(
    ([scheduleUid, schedule]) => {
      console.log(scheduleUid, schedule);
      return setDoc(getScheduleRef(scheduleUid), schedule, { merge: true });
    },
  )),
]);

type Validator<Payload> = (state: Readonly<SchedulesState>, payload: Payload) => string[];
type Dispatcher<Payload> = (payload: Payload & { sender?: string }) => ThunkAction<Promise<PayloadAction<Payload | ErrorData>>, RootState, undefined, PayloadAction<Payload | ErrorData>>;

/**
 * Wraps an action creator with some error handling and remote sync.
 * @param validatePayload takes in the current state and the payload and returns a list of errors.
 * @param createAction Takes the payload and creates an action
 * (typically one of the methods from schedulesSlice.actions).
 * @returns A wrapped action creator that will dispatch errors if any are encountered,
 * otherwise dispatches the change and updates the remote state to match the local.
 */
function createActionCreator<Payload>(
  validatePayload: Validator<Payload>,
  createAction: ActionCreatorWithPayload<Payload>,
): Dispatcher<Payload> {
  return (payload) => async (dispatch, getState) => {
    const errors = validatePayload(getState().schedules, payload);
    if (errors.length) {
      return dispatch(error({
        sender: payload.sender,
        errors,
      }));
    }
    const result = dispatch(createAction(payload));
    const uid = selectUserUid(getState());
    if (uid) await syncSchedules(uid, getState().schedules);
    return result;
  };
}

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

export const toggleHidden = createActionCreator<string>(
  () => [],
  schedulesSlice.actions.toggleHidden,
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

/**
 * Queries the `schedules` collection according to a set of constraints and saves
 * them to the Redux state.
 * @param constraints the set of Firestore constraints to query with.
 */
export function useSchedules(...constraints: QueryConstraint[]) {
  const dispatch = useAppDispatch();

  // listen for this user's schedules, load all of them into the class cache
  useEffect(() => {
    if (constraints.length === 0) {
      return;
    }
    const q = query(getSchedulesRef(), ...constraints);
    const unsubSchedules = onSnapshot(q, (snap) => {
      // load all of the classes into the class cache
      snap.docs.forEach((schedule) => {
        schedule.data().classes.forEach(({ classId }) => dispatch(ClassCache.loadClass(classId)));
      });
      const scheduleEntries = snap.docs.map((doc) => doc.data()).map((schedule) => [schedule.uid, schedule]);
      console.log(scheduleEntries);
      dispatch(overwriteSchedules(Object.fromEntries(scheduleEntries)));
    }, (err) => dispatch(setSnapshotError(err)));
    // eslint-disable-next-line consistent-return
    return unsubSchedules;
  }, constraints);
}
