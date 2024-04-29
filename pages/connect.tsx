import { FilterGrid } from '@/components/ConnectPageComponents/FilterGrid';
import { IncomingRequestList } from '@/components/ConnectPageComponents/FriendRequests';
import { SearchBar } from '@/components/ConnectPageComponents/SearchBar';
import { useFriends, useIds } from '@/components/ConnectPageComponents/friendUtils';
import { useLunrIndex } from '@/components/ConnectPageComponents/useLunrIndex';
import Layout from '@/components/Layout/Layout';
import CourseCardStyleProvider from '@/src/context/CourseCardStyleProvider';
import { useIncludeSemesters } from '@/src/context/includeSemesters';
import { useMeiliClient } from '@/src/context/meili';
import { ClassCache } from '@/src/features';
import {
  getDefaultSemesters, getCurrentDefaultClassYear, Term, termToSemester,
} from '@/src/lib';
import Schema from '@/src/schema';
import { alertUnexpectedError, useAppDispatch } from '@/src/utils/hooks';
import { getAllClassIds } from '@/src/utils/schedules';
import {
  QueryConstraint, getDocs, limit, query, startAfter, where,
} from 'firebase/firestore';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { ProfilesList } from '../components/ConnectPageComponents/ProfilesList';
import { AllSchedules, useShowProfiles } from '../components/ConnectPageComponents/useShowProfiles';

export default function ConnectPageWrapper() {
  return (
    <Layout title="Friends" verify="meili">
      {({ userId }) => (
        <CourseCardStyleProvider defaultStyle="text" readonly columns={4}>
          <div className="mx-auto sm:max-w-2xl">
            <FriendsPage userId={userId} />
          </div>
        </CourseCardStyleProvider>
      )}
    </Layout>
  );
}

function FriendsPage({ userId }: { userId: string }) {
  const dispatch = useAppDispatch();
  const { client, error } = useMeiliClient();
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
  const [searchValue, setSearchValue] = useState('');
  const { includeSemesters, profilesOnly } = useIncludeSemesters();

  const searchMore = useCallback(async (term: Term) => {
    if (!friends) return;

    if (error) {
      alertUnexpectedError(error);
      return;
    }

    const { year, season } = termToSemester(term);

    const constraints: QueryConstraint[] = [
      // can't have two inequality clauses
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

    if (client) {
      await dispatch(ClassCache.loadCourses(client, getAllClassIds(newSchedules)));
    }

    return snap.size;
  }, [allSchedules, client, dispatch, error, friends, includeSemesters.length]);

  useEffect(() => {
    const promises = includeSemesters.filter((semester) => !(semester in allSchedules)).map(searchMore);
    Promise.all(promises).catch(alertUnexpectedError);
  }, [allSchedules, includeSemesters, searchMore]);

  useEffect(() => {
    setDoneLoading(false);
  }, [includeSemesters]);

  return (
    <div className="space-y-6 px-4">
      <IncomingRequestList incomingPending={incomingPending} />

      <FilterGrid allSemesters={allSemesters} />

      <SearchBar
        handleChange={(e) => {
          const search = e.target.value;
          setSearchValue(search);
          if (!lunrIndex) return;
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
        showProfiles={
          includeSemesters.length === 0
          && searchValue.length === 0
            ? [] : showProfiles
        }
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


