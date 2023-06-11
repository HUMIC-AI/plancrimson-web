import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  deleteDoc, getDoc, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { Semester } from '@/src/lib';
import { v4 as uuidv4 } from 'uuid';
import Firestore from '../schema';
import type { AppDispatch, RootState } from '../store';
import type {
  ScheduleMap, ScheduleId, LocalSchedule, FirestoreSchedule, BaseSchedule,
} from '../types';

const initialState: ScheduleMap = {};

type CoursesPayload = { courses: string[]; scheduleId: string };

type PublicPayload = { scheduleId: string, public: boolean };

function unionSchedulesSlice(state: any, action: PayloadAction<LocalSchedule[]>) {
  action.payload.forEach((schedule) => {
    state[schedule.id] = schedule;
  });
}

export const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    overwriteSchedules(state, action: PayloadAction<LocalSchedule[]>) {
      Object.keys(state).forEach((key) => delete state[key]);
      unionSchedulesSlice(state, action);
    },

    unionSchedules: unionSchedulesSlice,

    create(state, action: PayloadAction<LocalSchedule>) {
      const { id, ...data } = action.payload;
      state[id] = { id, ...data };
    },

    setCourses(state, action: PayloadAction<CoursesPayload>) {
      const { scheduleId, courses } = action.payload;
      state[scheduleId].classes = courses;
    },

    deleteSchedule(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },

    setPublic(state, action: PayloadAction<PublicPayload>) {
      state[action.payload.scheduleId].public = action.payload.public;
    },

    rename(state, action: PayloadAction<{ scheduleId: string, title: string }>) {
      const { scheduleId, title } = action.payload;
      state[scheduleId].title = title;
    },

    clearSchedule(state, action: PayloadAction<string>) {
      state[action.payload].classes.length = 0;
    },
  },
});

// ========================= SELECTORS =========================

export const selectSchedules = (state: RootState) => state.schedules;

export function selectSchedule(scheduleId: ScheduleId | null | undefined) {
  return function ({ schedules }: RootState) {
    if (!scheduleId) return null;
    return schedules[scheduleId] ?? null;
  };
}

// ========================= ACTION CREATORS =========================

export const { overwriteSchedules, unionSchedules, clearSchedule } = schedulesSlice.actions;

// Checks if the given schedule is in the Redux store.
// If it is, throw an error.
// If it isn't, first wait to add it to Firestore.
// Then, add it to the Redux store.
// this should be the only point where schedules are created.
export const createSchedule = (schedule: BaseSchedule) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  if (schedule.id in state.schedules) {
    throw new Error('schedule already exists');
  }
  const ref = Firestore.schedule(schedule.id);
  await setDoc(ref, { ...schedule, createdAt: serverTimestamp() });
  const result = await getDoc(ref); // to load the createdAt field
  return dispatch(schedulesSlice.actions.create(toLocalSchedule(result.data()!)));
};

export const createDefaultSchedule = ({ season, year }: Semester, uid: string) => createSchedule(getDefaultSchedule({ season, year }, uid));

export const removeCourses = (payload: { scheduleId: string, courseIds: string[] }) => async (dispatch: AppDispatch) => {
  const { scheduleId, courseIds } = payload;
  const snap = await getDoc(Firestore.schedule(scheduleId));
  if (!snap.exists()) throw new Error('schedule does not exist');
  const classes = snap.data()!.classes.filter((classId) => !courseIds.includes(classId));
  await updateDoc(snap.ref, { classes });
  return dispatch(schedulesSlice.actions.setCourses({ scheduleId, courses: classes }));
};

export const renameSchedule = ({ scheduleId, title }: { scheduleId: string, title: string }) => async (dispatch: AppDispatch) => {
  await updateDoc(Firestore.schedule(scheduleId), { title });
  return dispatch(schedulesSlice.actions.rename({ scheduleId, title }));
};

export const setPublic = (payload: PublicPayload) => async (dispatch: AppDispatch) => {
  await updateDoc(Firestore.schedule(payload.scheduleId), { public: payload.public });
  return dispatch(schedulesSlice.actions.setPublic(payload));
};

export const deleteSchedule = (id: string) => async (dispatch: AppDispatch) => {
  await deleteDoc(Firestore.schedule(id));
  return dispatch(schedulesSlice.actions.deleteSchedule(id));
};

export const addCourses = ({ scheduleId, courses }: CoursesPayload) => async (dispatch: AppDispatch) => {
  const snap = await getDoc(Firestore.schedule(scheduleId));
  if (!snap.exists) throw new Error('schedule not found');
  const { classes } = snap.data()!;
  courses.forEach((classId) => {
    if (!classes.find((id) => id === classId)) {
      classes.push(classId);
    }
  });
  await updateDoc(snap.ref, { classes });
  return dispatch(schedulesSlice.actions.setCourses({ scheduleId, courses: classes }));
};

export const getDefaultSchedule = ({ season, year }: Semester, uid: string) => ({
  id: uuidv4(),
  title: `My ${season} ${year}`,
  season,
  year,
  classes: [],
  ownerUid: uid,
  public: true,
});

export const toLocalSchedule = (schedule: FirestoreSchedule): LocalSchedule => ({
  ...schedule,
  createdAt: schedule.createdAt?.toDate().toISOString() ?? '',
});

