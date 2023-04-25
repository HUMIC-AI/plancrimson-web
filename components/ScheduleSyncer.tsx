import { useMemo } from 'react';
import useSyncSchedulesMatchingContraints from '@/src/utils/schedules';
import { where } from 'firebase/firestore';

/**
 * Dummy component for getting this user's schedules from the database.
 */
export function ScheduleSyncer({ userId }: { userId: string; }) {
  const constraints = useMemo(() => [where('ownerUid', '==', userId)], [userId]);
  useSyncSchedulesMatchingContraints(constraints);
  return null;
}
