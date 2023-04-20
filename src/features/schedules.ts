/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  deleteDoc, getDoc, setDoc, updateDoc,
} from 'firebase/firestore';
import { Semester } from 'plancrimson-utils';
import { v4 as uuidv4 } from 'uuid';
import Firestore from '../schema';
import type { AppDispatch, RootState } from '../store';
import { ScheduleMap, UserClassData, Schedule } from '../types';

const initialState: ScheduleMap = {};

type CoursesPayload = { courses: UserClassData[]; scheduleId: string };
type PublicPayload = { scheduleId: string, public: boolean };

export const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    overwriteSchedules(state, action: PayloadAction<Schedule[]>) {
      // clear all current schedules
      Object.keys(state).forEach((key) => delete state[key]);
      action.payload.forEach((schedule) => {
        state[schedule.id] = schedule;
      });
    },

    create(state, action: PayloadAction<Schedule>) {
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

    rename(state, action: PayloadAction<{ scheduleId: string, title: string }>) {
      const { scheduleId, title } = action.payload;
      state[scheduleId].title = title;
    },

    setPublic(state, action: PayloadAction<PublicPayload>) {
      state[action.payload.scheduleId].public = action.payload.public;
    },

    clearSchedule(state, action: PayloadAction<string>) {
      state[action.payload].classes.length = 0;
    },
  },
});

// ========================= SELECTORS =========================

export const selectSchedules = (state: RootState) => state.schedules;
export const selectSchedule = (scheduleId: string | null) => function ({ schedules }: RootState) {
  if (scheduleId === null) return null;
  return schedules[scheduleId];
};

// ========================= ACTION CREATORS =========================

export const { overwriteSchedules, clearSchedule } = schedulesSlice.actions;

// Checks if the given schedule is in the Redux store.
// If it is, throw an error.
// If it isn't, first wait to add it to Firestore.
// Then, add it to the Redux store.
export const createSchedule = (schedule: Schedule) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  if (schedule.id in state.schedules) {
    throw new Error('schedule already exists');
  }
  await setDoc(Firestore.schedule(schedule.id), schedule);
  return dispatch(schedulesSlice.actions.create(schedule));
};

export const createDefaultSchedule = ({ season, year }: Semester, uid: string) => createSchedule({
  id: uuidv4(),
  title: `My ${season} ${year}`,
  season,
  year,
  classes: [],
  ownerUid: uid,
  public: false,
});

export const removeCourses = (payload: { scheduleId: string, courseIds: string[] }) => async (dispatch: AppDispatch) => {
  const { scheduleId, courseIds } = payload;
  const snap = await getDoc(Firestore.schedule(scheduleId));
  if (!snap.exists()) throw new Error('schedule does not exist');
  const classes = snap.data()!.classes.filter(({ classId }) => !courseIds.includes(classId));
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
  courses.forEach(({ classId }) => {
    if (!classes.find(({ classId: id }) => id === classId)) {
      classes.push({ classId });
    }
  });
  await updateDoc(snap.ref, { classes });
  return dispatch(schedulesSlice.actions.setCourses({ scheduleId, courses: classes }));
};
