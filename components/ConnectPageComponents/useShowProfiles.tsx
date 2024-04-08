import { ProfileWithSchedules, useAllProfiles } from '@/components/ConnectPageComponents/useLunrIndex';
import { useIncludeSemesters } from '@/src/context/includeSemesters';
import { Term, semesterToTerm } from '@/src/lib';
import {
  BaseSchedule, FirestoreSchedule, UserProfile, WithId,
} from '@/src/types';
import { useSharedCourses } from '@/src/utils/schedules';
import { DocumentSnapshot } from 'firebase/firestore';
import { useMemo } from 'react';

export type AllSchedules = Record<Term, {
  schedules: WithId<BaseSchedule>[];
  bookmark: DocumentSnapshot<FirestoreSchedule> | null;
}>;

export function useShowProfiles({
  allSchedules, friends, friendIds, friendsOnly,
}: {
  allSchedules: AllSchedules;
  friends: WithId<UserProfile>[] | undefined;
  friendIds: string[] | undefined;
  friendsOnly: boolean;
}) {
  const allProfiles = useAllProfiles();
  const { includeSemesters, profilesOnly } = useIncludeSemesters();
  const friendSchedules = useSharedCourses(friendIds);

  // get a massive list of all loaded schedules
  const mergedSchedules = useMemo(() => {
    const schedules = [...Object.values(friendSchedules).flat(), ...Object.values(allSchedules).flatMap((term) => term.schedules)];
    const seen = new Set<string>();
    return schedules.filter((schedule) => {
      if (seen.has(schedule.id)) return false;
      seen.add(schedule.id);
      return true;
    });
  }, [friendSchedules, allSchedules]);

  // get a list of profiles
  const showProfiles = useMemo((): ProfileWithSchedules[] => {
    if (!allProfiles || !mergedSchedules) return [];

    const friendMap = new Set(friendIds);

    if (profilesOnly) {
      const profiles = friendsOnly
        ? allProfiles.filter((profile) => friendMap.has(profile.id))
        : allProfiles;

      return profiles.map((profile) => ({
        ...profile,
        currentSchedules: [],
      }));
    }

    const filterSchedules = (ownerUid: string, schedule: BaseSchedule) => schedule.ownerUid === ownerUid && includeSemesters.includes(semesterToTerm(schedule));

    return (friendsOnly ? friends! : allProfiles).map((profile) => ({
      ...profile,
      currentSchedules: mergedSchedules.filter((schedule) => filterSchedules(profile.id, schedule)),
    }));
  }, [allProfiles, mergedSchedules, friendIds, profilesOnly, friendsOnly, friends, includeSemesters]);

  const emptySchedulesRemoved = useMemo(() => {
    if (profilesOnly) return showProfiles;
    return showProfiles.map((profile) => ({
      ...profile,
      currentSchedules: profile.currentSchedules.filter((schedule) => schedule.classes && schedule.classes.length > 0),
    }));
  }, [profilesOnly, showProfiles]);

  return emptySchedulesRemoved;
}
