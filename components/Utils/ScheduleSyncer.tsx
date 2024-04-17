import { useCallback, useEffect } from 'react';
import {
  QuerySnapshot, onSnapshot, query, where,
} from 'firebase/firestore';
import { useMeiliClient } from '@/src/context/meili';
import { ClassCache, Schedules } from '@/src/features';
import { toLocalSchedule } from '@/src/features/schedules';
import Schema from '@/src/schema';
import { FirestoreSchedule } from '@/src/types';
import { useAppDispatch, alertUnexpectedError } from '@/src/utils/hooks';
import { getAllClassIds } from '@/src/utils/schedules';


/**
 * Dummy component for getting this user's schedules from the database.
 * Listen to all of this user's schedules on Firestore.
 * Load these schedules into the Redux store and also load all courses from all schedules into the Redux "class cache".
 * Expects access to the MeiliSearch client through React Context.
 */
export function ScheduleSyncer({ userId }: {
  userId: string;
}) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();

  const updateSchedules = useCallback(async (snap: QuerySnapshot<FirestoreSchedule>) => {
    try {
      const schedules = snap.docs.map((doc) => doc.data());

      console.info('[useSchedules] Reloaded schedules');

      // load all of the classes into the class cache
      if (client) {
        await dispatch(ClassCache.loadCourses(client, getAllClassIds(schedules)));
      }

      dispatch(Schedules.overwriteSchedules(schedules.map(toLocalSchedule)));
    } catch (err) {
      alertUnexpectedError(err);
    }
  }, [dispatch, client]);

  useEffect(() => {
    const q = query(Schema.Collection.schedules(), where('ownerUid', '==', userId));

    const unsubSchedules = onSnapshot(q, updateSchedules, (err) => {
      console.error('[useSchedules] error listening for schedules (in the layout):', err);
    });

    return unsubSchedules;
  }, [client, updateSchedules, userId]);

  return null;
}
