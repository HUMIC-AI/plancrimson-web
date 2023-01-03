// separate file for useSchedules hook to avoid circular dependency

import { onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { useEffect } from 'react';
import Schema from 'shared/schema';
import { ClassCache, Schedules } from './features';
import { useAppDispatch } from './hooks';
import { useMeiliClient } from './meili';

/**
 * Listen to all schedules on Firestore that meet the given constraints.
 * Load these schedules into the Redux store and also load all courses from all schedules into the Redux "class cache".
 * Expects access to the MeiliSearch client through React Context.
 */
export default function useSchedules(constraints: QueryConstraint[]) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();

  useEffect(() => {
    if (constraints.length === 0) {
      return;
    }

    const q = query(Schema.Collection.schedules(), ...constraints);
    const unsubSchedules = onSnapshot(q, (snap) => {
      const scheduleEntries = snap.docs.map((doc) => doc.data());
      const classIds = scheduleEntries.flatMap((schedule) => schedule.classes.map(({ classId }) => classId));

      console.debug('[useSchedules] Reloaded schedules');

      // load all of the classes into the class cache
      if (client) {
        dispatch(ClassCache.loadCourses(client, classIds));
      }

      dispatch(Schedules.overwriteSchedules(scheduleEntries));
    }, (err) => {
      console.error('[useSchedules] error listening for schedules (in the layout):', err);
    });

    return unsubSchedules;
  }, [constraints, client]);
}

