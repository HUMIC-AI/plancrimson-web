/* eslint-disable react/no-this-in-sfc */
import { Auth, ClassCache } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import { useEffect, useState } from 'react';
import Schema from '@/src/schema';
import {
  getDocs, orderBy, query, where,
} from 'firebase/firestore';
import {
  BaseSchedule,
  UserProfile, WithId,
} from '@/src/types';
import { alertUnexpectedError, useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { Season } from '@/src/lib';
import ScheduleSection from '@/components/SemesterSchedule/ScheduleList';
import { setExpand } from '@/src/features/semesterFormat';
import { useMeiliClient } from '@/src/context/meili';
import Link from 'next/link';
import lunr from 'lunr';
import { getAllClassIds } from '@/src/utils/schedules';


export default function () {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <Layout title="Friends" />;

  return (
    <Layout title="Friends" withMeili>
      <div className="mx-auto max-w-xl">
        <FriendsPage />
      </div>
    </Layout>
  );
}

function FriendsPage() {
  const [profiles, setProfiles] = useState<WithId<UserProfile & { currentSchedules: BaseSchedule[] }>[]>([]);
  const [lunrIndex, setLunrIndex] = useState<lunr.Index | null>(null);
  const [matchIds, setMatchIds] = useState<null | string[]>(null); // ids of profiles that match the search query
  const { client } = useMeiliClient();
  const classCache = useAppSelector(ClassCache.selectClassCache);
  const dispatch = useAppDispatch();
  useEffect(() => {
    // set expand to just text
    dispatch(setExpand('text'));
  }, []);

  // no need to listen, just fetch once
  useEffect(() => {
    if (!client) return;

    const now = new Date();
    const year = now.getFullYear();
    const season: Season = now.getMonth() < 6 ? 'Spring' : 'Fall';

    const profilesPromise = getDocs(Schema.Collection.profiles()).then((snap) => snap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })));

    const q = query(
      Schema.Collection.schedules(),
      where('classes', '!=', []),
      where('year', '==', year),
      where('season', '==', season),
    );

    const schedulesPromise = getDocs(q).then((snap) => snap.docs.map((doc) => doc.data()));

    Promise.all([profilesPromise, schedulesPromise])
      .then(([allProfiles, allSchedules]) => {
        dispatch(ClassCache.loadCourses(client, getAllClassIds(allSchedules)));

        const profilesAndCourses = allProfiles
          .map((profile) => ({
            ...profile,
            currentSchedules: allSchedules
              .filter((schedule) => schedule.ownerUid === profile.id && schedule.classes.length > 0),
          }))
          .filter((profile) => profile.currentSchedules.length > 0);

        setProfiles(profilesAndCourses);
      })
      .catch((err) => {
        alertUnexpectedError(err);
      });
  }, [client]);

  useEffect(() => {
    const idx = lunr(function () {
      this.ref('id');
      this.field('displayName');
      this.field('username');
      this.field('bio');
      this.field('classYear');
      this.field('courseTitles');

      profiles.forEach((profile) => {
        const courseTitles = profile.currentSchedules.map((schedule) => schedule.classes.map((classId) => (
          classId in classCache ? [
            classCache[classId].Title,
            classCache[classId].SUBJECT,
            classCache[classId].CATALOG_NBR,
            classCache[classId].IS_SCL_DESCR_IS_SCL_DESCRL,
            classCache[classId].textDescription,
          ] : null
        ))).flat(4).filter(Boolean).join(' ');

        this.add({ ...profile, courseTitles });
      });
    });

    setLunrIndex(idx);
  }, [profiles, classCache]);

  return (
    <div>
      <p className="text-center">
        Showing all schedules for Fall 2023.
      </p>

      {/* search bar */}
      <div className="mt-6 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search for a classmate"
          className="grow rounded-lg bg-gray-secondary px-4 py-2"
          onChange={(e) => {
            if (!lunrIndex) return;
            const search = e.target.value;
            if (search.length === 0) {
              setMatchIds(null);
            } else {
              const results = lunrIndex.search(search);
              setMatchIds(results.map((result) => result.ref));
            }
          }}
        />
      </div>

      <ul className="mt-6 space-y-4">
        {profiles.filter((profile) => matchIds === null || matchIds.includes(profile.id)).map((profile) => (
          <li key={profile.id} className="space-y-4 rounded-lg bg-gray-secondary px-4 py-2">
            <Link href={`/user/${profile.username}`} className="interactive">
              <h3 title={profile.username!}>
                {profile.displayName || profile.username || 'Anonymous'}
                {' '}
                &middot;
                {' '}
                {profile.classYear}
              </h3>
            </Link>
            <p>
              {profile.bio || "This user hasn't written a bio yet."}
            </p>
            {profile.currentSchedules.length > 0 && (
            <ul className="space-y-2">
              {profile.currentSchedules.map((schedule) => (
                <li key={schedule.id}>
                  <h4 className="mb-2 font-medium">
                    {schedule.title}
                  </h4>
                  <ScheduleSection schedule={schedule} hideHeader />
                </li>
              ))}
            </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
