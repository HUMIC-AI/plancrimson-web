import { ClassCache } from '@/src/features';
import { useEffect, useState } from 'react';
import {
  BaseSchedule,
  UserProfile, WithId,
} from '@/src/types';
import { alertUnexpectedError, useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import lunr from 'lunr';
import Schema, { queryWithId } from '@/src/schema';
import { getClasses } from '@/src/features/schedules';

export type ProfileWithSchedules = WithId<UserProfile & { currentSchedules: BaseSchedule[]; }>;

export function useLunrIndex(profiles: ProfileWithSchedules[]) {
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const [lunrIndex, setLunrIndex] = useState<lunr.Index | null>(null);

  useEffect(() => {
    const idx = lunr(function () {
      this.ref('id');
      this.field('displayName');
      this.field('username');
      this.field('bio');
      this.field('classYear');
      this.field('courseTitles');

      profiles.forEach((profile) => {
        const courseTitles = profile.currentSchedules.map((schedule) => getClasses(schedule).map((classId) => (
          classId in classCache ? [
            classCache[classId].Title,
            classCache[classId].SUBJECT,
            classCache[classId].CATALOG_NBR,
            classCache[classId].IS_SCL_DESCR_IS_SCL_DESCRL,
            classCache[classId].textDescription,
          ] : null
        ))).flat(5).filter(Boolean).join(' '); // extra flat just in case

        this.add({ ...profile, courseTitles });
      });
    });

    setLunrIndex(idx);
  }, [profiles, classCache]);

  return lunrIndex;
}

export function useAllProfiles() {
  const dispatch = useAppDispatch();
  const [allProfiles, setAllProfiles] = useState<WithId<UserProfile>[]>();

  useEffect(() => {
    queryWithId(Schema.Collection.profiles())
      .then(setAllProfiles)
      .catch(alertUnexpectedError);
  }, [dispatch]);

  return allProfiles;
}
