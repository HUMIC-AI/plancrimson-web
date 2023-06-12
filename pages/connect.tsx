import ConnectProfileCard from '@/components/ConnectPageComponents/ConnectProfileCard';
import { FilterGrid } from '@/components/ConnectPageComponents/FilterGrid';
import { IncomingRequestList } from '@/components/ConnectPageComponents/FriendRequests';
import { SearchBar } from '@/components/ConnectPageComponents/SearchBar';
import { useFriends, useIds } from '@/components/ConnectPageComponents/friendUtils';
import { ProfileWithSchedules, useAllProfiles, useLunrIndex } from '@/components/ConnectPageComponents/useLunrIndex';
import Layout from '@/components/Layout/Layout';
import ExpandCardsProvider from '@/src/context/expandCards';
import { useMeiliClient } from '@/src/context/meili';
import { Auth, ClassCache } from '@/src/features';
import {
  getDefaultSemesters, getCurrentDefaultClassYear, Term, semesterToTerm, termToSemester, getCurrentSemester,
} from '@/src/lib';
import Schema from '@/src/schema';
import {
  BaseSchedule, FirestoreSchedule, UserProfile, WithId,
} from '@/src/types';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { getAllClassIds, useSharedCourses } from '@/src/utils/schedules';
import { classNames } from '@/src/utils/styles';
import { getDisplayName } from '@/src/utils/utils';
import {
  DocumentSnapshot, QueryConstraint, getDocs, limit, query, startAfter, where,
} from 'firebase/firestore';
import Link from 'next/link';
import {
  Fragment, useCallback, useEffect, useMemo, useState,
} from 'react';

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
  const [includedSemesters, setIncludedSemesters] = useState<Term[]>([]);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [matchIds, setMatchIds] = useState<null | string[]>(null); // ids of profiles that match the search query
  const [doneLoading, setDoneLoading] = useState(false);
  const profilesOnly = useMemo(() => includedSemesters.length === 0, [includedSemesters.length]);
  const showProfiles = useShowProfiles({
    allSchedules, profilesOnly, friends, friendIds, includedSemesters, friendsOnly,
  });
  const lunrIndex = useLunrIndex(showProfiles);

  const searchMore = useCallback(async (term: Term) => {
    if (!friends) return;

    const { year, season } = termToSemester(term);

    const constraints: QueryConstraint[] = [
      // where('ownerUid', 'not-in', [...friends.map((u) => u.id), userId]),
      where('public', '==', true),
      where('year', '==', year),
      where('season', '==', season),
      where('classes', '!=', null),
      limit(Math.floor(40 / includedSemesters.length)),
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
  }, [allSchedules, client, dispatch, friends, includedSemesters.length]);

  useEffect(() => {
    const promises = includedSemesters.filter((semester) => !(semester in allSchedules)).map(searchMore);
    Promise.all(promises).catch(alertUnexpectedError);
  }, [allSchedules, includedSemesters, searchMore]);

  // filter for the current semester on initial load
  useEffect(() => setIncludedSemesters([semesterToTerm(getCurrentSemester())]), []);

  useEffect(() => {
    setDoneLoading(false);
  }, [includedSemesters]);

  return (
    <div className="space-y-6">
      <IncomingRequestList incomingPending={incomingPending} />

      <FilterGrid
        includedSemesters={includedSemesters}
        setIncludedSemesters={setIncludedSemesters}
        allSemesters={allSemesters}
      />

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
        includedSemesters={includedSemesters}
      />

      {!profilesOnly && (
        <LoadMoreButton
          includedSemesters={includedSemesters}
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
          includedSemesters={includedSemesters}
          searchMore={searchMore}
          setDoneLoading={setDoneLoading}
          doneLoading={doneLoading}
        />
      )}
    </div>
  );
}

function LoadMoreButton({
  includedSemesters, searchMore, setDoneLoading, doneLoading,
}: {
  includedSemesters: Term[];
  searchMore: (term: Term) => Promise<number | undefined>;
  setDoneLoading: (done: boolean) => void;
  doneLoading: boolean;
}) {
  return (
    <button
      type="button"
      className="interactive w-full rounded-lg bg-gray-secondary px-4 py-2 text-lg font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
      onClick={() => Promise.all(includedSemesters.map(searchMore))
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

function ProfilesList({
  profilesOnly, showProfiles, matchIds, friendIds,
}: {
  profilesOnly: boolean;
  showProfiles: ProfileWithSchedules[];
  matchIds: string[] | null;
  friendIds: string[] | undefined;
}) {
  const userId = Auth.useAuthProperty('uid');

  const isFriend = (profile: { id: string }) => friendIds?.includes(profile.id);

  // const uniqueYears = new Set(showProfiles.map((profile) => profile.classYear));
  // const uniqueYearsArray: number[] = [];
  // uniqueYears.forEach((year) => year && uniqueYearsArray.push(year));
  // uniqueYearsArray.sort((a, b) => b - a);

  const yearSplit: Record<number, ProfileWithSchedules[]> = {};

  showProfiles.sort((a, b) => {
    // sort by last name
    const aParts = getDisplayName(a).split(' ');
    const bParts = getDisplayName(b).split(' ');
    const aName = aParts[aParts.length - 1];
    const bName = bParts[bParts.length - 1];
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  }).filter((profile) => {
    // don't include current user
    if (profile.id === userId) return false;
    // don't include empty profiles
    if (!profilesOnly && profile.currentSchedules.length === 0) return false;
    // don't include profiles that don't match the search query
    if (matchIds === null) return true;
    if (!matchIds.includes(profile.id)) return false;
    return true;
  }).forEach((profile) => {
    const year = profile.classYear ?? -1;
    if (!yearSplit[year]) yearSplit[year] = [];
    yearSplit[year].push(profile);
  });

  const uniqueYears = Object.keys(yearSplit)
    .map((year) => parseInt(year, 10))
    .sort((a, b) => b - a);

  // create a new section for each year
  return (
    <>
      {uniqueYears.map((year) => (
        <Fragment key={year}>
          <h2 className="text-2xl font-bold">{year}</h2>
          {profilesOnly ? (
            <ul className="flex flex-wrap items-start gap-x-4 gap-y-2">
              {yearSplit[year].map((profile) => (
                <li key={profile.id}>
                  <Link
                    href={`/user/${profile.username}`}
                    className={classNames(
                      'interactive',
                      isFriend(profile) ? 'text-blue-primary' : 'text-gray-primary',
                    )}
                  >
                    {getDisplayName(profile)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-wrap items-start gap-4">
              {yearSplit[year].map((profile) => (
                <li key={profile.id}>
                  <ConnectProfileCard isFriend={isFriend(profile)} profile={profile} />
                </li>
              ))}
            </ul>
          )}
        </Fragment>
      ))}
    </>
  );
}

function useShowProfiles({
  allSchedules, profilesOnly, friends, friendIds, includedSemesters, friendsOnly,
}: {
  allSchedules: AllSchedules;
  profilesOnly: boolean;
  friends: WithId<UserProfile>[] | undefined;
  friendIds: string[] | undefined;
  includedSemesters: Term[];
  friendsOnly: boolean;
}) {
  const allProfiles = useAllProfiles();
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

    const filterSchedules = (ownerUid: string, schedule: BaseSchedule) => schedule.ownerUid === ownerUid && includedSemesters.includes(semesterToTerm(schedule));

    return (friendsOnly ? friends! : allProfiles).map((profile) => ({
      ...profile,
      currentSchedules: mergedSchedules.filter((schedule) => filterSchedules(profile.id, schedule)),
    }));
  }, [allProfiles, mergedSchedules, friendIds, profilesOnly, friendsOnly, friends, includedSemesters]);

  const emptySchedulesRemoved = useMemo(() => {
    if (profilesOnly) return showProfiles;
    return showProfiles.map((profile) => ({
      ...profile,
      currentSchedules: profile.currentSchedules.filter((schedule) => schedule.classes && schedule.classes.length > 0),
    }));
  }, [profilesOnly, showProfiles]);

  return emptySchedulesRemoved;
}
