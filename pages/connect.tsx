import { FilterGrid } from '@/components/ConnectPageComponents/FilterGrid';
import { IncomingRequestList } from '@/components/ConnectPageComponents/FriendRequests';
import { SearchBar } from '@/components/ConnectPageComponents/SearchBar';
import { useFriends, useIds } from '@/components/ConnectPageComponents/friendUtils';
import { ProfileWithSchedules, useAllProfiles, useLunrIndex } from '@/components/ConnectPageComponents/useLunrIndex';
import Layout from '@/components/Layout/Layout';
import ExpandCardsProvider from '@/src/context/expandCards';
import { useIncludeSemesters } from '@/src/context/includeSemesters';
import { useMeiliClient } from '@/src/context/meili';
import { ClassCache } from '@/src/features';
import {
  getDefaultSemesters, getCurrentDefaultClassYear, Term, semesterToTerm, termToSemester,
} from '@/src/lib';
import Schema from '@/src/schema';
import {
  BaseSchedule, FirestoreSchedule, UserProfile, WithId,
} from '@/src/types';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { getAllClassIds, useSharedCourses } from '@/src/utils/schedules';
import {
  DocumentSnapshot, QueryConstraint, getDocs, limit, query, startAfter, where,
} from 'firebase/firestore';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { ProfilesList } from '../components/ConnectPageComponents/ProfilesList';

export default function () {
  return (
    <Layout title="Friends" verify="meili">
      {({ userId }) => (
        <ExpandCardsProvider defaultStyle="text" readonly>
          <div className="mx-auto sm:max-w-2xl">
            <FriendsPage userId={userId} />
          </div>
        </ExpandCardsProvider>
      )}
    </Layout>
  );
}

type AllSchedules = Record<Term, {
  schedules: WithId<BaseSchedule>[];
  bookmark: DocumentSnapshot<FirestoreSchedule> | null;
}>;

function FriendsPage({ userId }: { userId: string }) {
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { friends, incomingPending } = useFriends(userId);
  const friendIds = useIds(friends);
  const allSemesters = useMemo(() => getDefaultSemesters(getCurrentDefaultClassYear(), 6).slice(1, -1), []);
  const [allSchedules, setAllSchedules] = useState<AllSchedules>({});
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [matchIds, setMatchIds] = useState<null | string[]>(null); // ids of profiles that match the search query
  const [doneLoading, setDoneLoading] = useState(false);
  const showProfiles = useShowProfiles({
    allSchedules, friends, friendIds, friendsOnly,
  });
  const lunrIndex = useLunrIndex(showProfiles);
  const { includeSemesters, profilesOnly } = useIncludeSemesters();

  const searchMore = useCallback(async (term: Term) => {
    if (!friends) return;

    const { year, season } = termToSemester(term);

    const constraints: QueryConstraint[] = [
      // where('ownerUid', 'not-in', [...friends.map((u) => u.id), userId]),
      where('public', '==', true),
      where('year', '==', year),
      where('season', '==', season),
      where('classes', '!=', null),
      limit(Math.floor(40 / includeSemesters.length)),
    ];

    const previousBookmark = allSchedules[term]?.bookmark;
    if (previousBookmark) {
      constraints.push(startAfter(previousBookmark));
    }

    const q = query(
      Schema.Collection.schedules(),
      ...constraints,
    );
    const snap = await getDocs(q);
    const newSchedules = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setAllSchedules((schedules) => ({
      ...schedules,
      [term]: {
        schedules: [
          ...schedules[term]?.schedules ?? [],
          ...newSchedules,
        ],
        bookmark: snap.docs[snap.docs.length - 1] ?? null,
      },
    }));

    await dispatch(ClassCache.loadCourses(client, getAllClassIds(newSchedules)));

    return snap.size;
  }, [allSchedules, client, dispatch, friends, includeSemesters.length]);

  useEffect(() => {
    const promises = includeSemesters.filter((semester) => !(semester in allSchedules)).map(searchMore);
    Promise.all(promises).catch(alertUnexpectedError);
  }, [allSchedules, includeSemesters, searchMore]);

  useEffect(() => {
    setDoneLoading(false);
  }, [includeSemesters]);

  return (
    <div className="space-y-6">
      <IncomingRequestList incomingPending={incomingPending} />

      <FilterGrid allSemesters={allSemesters} />

      <SearchBar
        handleChange={(e) => {
          if (!lunrIndex) return;
          const search = e.target.value;
          if (search.length === 0) {
            setMatchIds(null);
          } else {
            const results = lunrIndex.search(search);
            setMatchIds(results.map((result) => result.ref));
          }
        }}
        setFriendsOnly={setFriendsOnly}
        friendsOnly={friendsOnly}
      />

      {!profilesOnly && (
        <LoadMoreButton
          searchMore={searchMore}
          setDoneLoading={setDoneLoading}
          doneLoading={doneLoading}
        />
      )}

      <ProfilesList
        profilesOnly={profilesOnly}
        showProfiles={showProfiles}
        matchIds={matchIds}
        friendIds={friendIds}
      />

      {!profilesOnly && (
        <LoadMoreButton
          searchMore={searchMore}
          setDoneLoading={setDoneLoading}
          doneLoading={doneLoading}
        />
      )}
    </div>
  );
}

function LoadMoreButton({
  searchMore, setDoneLoading, doneLoading,
}: {
  searchMore: (term: Term) => Promise<number | undefined>;
  setDoneLoading: (done: boolean) => void;
  doneLoading: boolean;
}) {
  const { includeSemesters } = useIncludeSemesters();

  return (
    <button
      type="button"
      className="interactive w-full rounded-lg bg-gray-secondary px-4 py-2 text-lg font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
      onClick={() => Promise.all(includeSemesters.map(searchMore))
        .then((results) => {
          if (results.every((result) => result === 0)) {
            setDoneLoading(true);
          }
        })
        .catch((err) => console.error(err))}
      disabled={doneLoading}
    >
      Load more
    </button>
  );
}

function useShowProfiles({
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
