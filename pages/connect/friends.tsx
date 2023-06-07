/* eslint-disable react/no-this-in-sfc */
import { Auth, ClassCache } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import { useEffect, useState } from 'react';
import Schema from '@/src/schema';
import {
  getDocs, query, where,
} from 'firebase/firestore';
import {
  Schedule, UserProfile, WithId,
} from '@/src/types';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { Season } from '@/src/lib';
import ScheduleSection from '@/components/SemesterSchedule/ScheduleList';
import { setExpand } from '@/src/features/semesterFormat';
import { useMeiliClient } from '@/src/context/meili';
import Link from 'next/link';
import lunr from 'lunr';


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
  const [profiles, setProfiles] = useState<WithId<UserProfile & { currentSchedules: Schedule[] }>[]>([]);
  const [lunrIndex, setLunrIndex] = useState<lunr.Index | null>(null);
  const [matchIds, setMatchIds] = useState<null | string[]>(null); // ids of profiles that match the search query
  const { client } = useMeiliClient();
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
      where('year', '==', year),
      where('season', '==', season),
    );

    const schedulesPromise = getDocs(q).then((snap) => snap.docs.map((doc) => doc.data()));

    Promise.all([profilesPromise, schedulesPromise])
      .then(([allProfiles, allSchedules]) => {
        dispatch(ClassCache.loadCourses(client, allSchedules.flatMap((schedule) => schedule.classes.map((course) => course.classId))));

        const profilesAndCourses = allProfiles.map((profile) => ({
          ...profile,
          currentSchedules: allSchedules.filter((schedule) => schedule.ownerUid === profile.id && schedule.classes.length > 0),
        }));

        setProfiles(profilesAndCourses);

        const idx = lunr(function () {
          this.ref('id');
          this.field('displayName');
          this.field('username');
          this.field('bio');
          this.field('classYear');

          profilesAndCourses.forEach((profile) => {
            this.add(profile);
          });
        });

        setLunrIndex(idx);
      })
      .catch((err) => {
        alertUnexpectedError(err);
      });
  }, [client]);

  return (
    <div>
      {/* search bar */}
      <div className="flex items-center space-x-2">
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
                {profile.displayName}
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
