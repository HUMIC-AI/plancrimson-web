/* eslint-disable react/no-this-in-sfc */
import { Auth, ClassCache } from '@/src/features';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import {
  Fragment, useEffect, useMemo, useState,
} from 'react';
import Schema, { queryWithId } from '@/src/schema';
import {
  BaseSchedule,
  UserProfile, WithId,
} from '@/src/types';
import {
  alertUnexpectedError, useAppDispatch, useAppSelector, useElapsed,
} from '@/src/utils/hooks';
import {
  Semester,
  Term, getCurrentDefaultClassYear, getCurrentSemester, getDefaultSemesters, semesterToTerm, termToSemester,
} from '@/src/lib';
import ScheduleSection from '@/components/SemesterSchedule/ScheduleList';
import { useMeiliClient } from '@/src/context/meili';
import Link from 'next/link';
import lunr from 'lunr';
import { getAllClassIds, getOtherSchedulesAcrossSemesters } from '@/src/utils/schedules';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import { Disclosure } from '@headlessui/react';
import { FaAngleDown } from 'react-icons/fa';
import { classNames } from '@/src/utils/styles';
import { useFriends } from '@/components/ConnectPageComponents/friendUtils';
import { IncomingRequestList } from '@/components/ConnectPageComponents/FriendRequests';
import { getDisplayName } from '@/src/utils/utils';
import ExpandCardsProvider from '@/src/context/expandCards';


export default function () {
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(1000, []);

  if (userId === null) {
    return <ErrorPage>{errorMessages.unauthorized}</ErrorPage>;
  }

  if (typeof userId === 'undefined') {
    return (
      <Layout title="Friends">
        {elapsed && <LoadingBars />}
      </Layout>
    );
  }

  return (
    <Layout title="Friends" withMeili>
      <ExpandCardsProvider defaultStyle="text" readonly>
        <div className="mx-auto max-w-xl">
          <FriendsPage userId={userId} />
        </div>
      </ExpandCardsProvider>
    </Layout>
  );
}

function FriendsPage({
  userId,
}: {
  userId: string;
}) {
  const [allProfiles, setAllProfiles] = useState<WithId<UserProfile>[]>();
  const [profiles, setProfiles] = useState<WithId<UserProfile & { currentSchedules: BaseSchedule[] }>[]>([]);
  const [filterTerms, setFilterTerms] = useState<Term[]>([semesterToTerm(getCurrentSemester())]);
  const [matchIds, setMatchIds] = useState<null | string[]>(null); // ids of profiles that match the search query
  const { friends, incomingPending } = useFriends(userId);
  const { client } = useMeiliClient();
  const lunrIndex = useLunrIndex(profiles);
  const dispatch = useAppDispatch();

  // set expand to just text
  useEffect(() => {
    queryWithId(Schema.Collection.profiles())
      .then(setAllProfiles)
      .catch(alertUnexpectedError);
  }, [dispatch]);

  // no need to listen, just fetch once
  useEffect(() => {
    if (!allProfiles || !client || filterTerms.length === 0 || !friends) return;

    getOtherSchedulesAcrossSemesters(
      userId,
      friends.map((u) => u.id),
      filterTerms.map(termToSemester),
    )
      .then((allSchedules) => {
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
      .catch(alertUnexpectedError);
  }, [allProfiles, client, dispatch, filterTerms, friends, userId]);

  useEffect(() => {
    if (allProfiles && filterTerms.length === 0) {
      setProfiles(allProfiles.map((profile) => ({
        ...profile,
        currentSchedules: [],
      })));
    }
  }, [allProfiles, filterTerms.length]);

  const allSemesters = useMemo(() => getDefaultSemesters(getCurrentDefaultClassYear(), 6).slice(1, -1), []);

  return (
    <div className="space-y-6">
      <IncomingRequestList incomingPending={incomingPending} />

      <div className="grid grid-flow-col grid-rows-3 items-center justify-center justify-items-center">
        <div />
        {['Spring', 'Fall'].map((season) => (
          <FilterButton
            key={season}
            filterTerms={filterTerms}
            season={season}
            setFilterSemesters={setFilterTerms}
            allSemesters={allSemesters}
          />
        ))}

        {/* show a checkbox for each possible semester */}
        {allSemesters.map(({ year, season }) => (
          <Fragment key={`${year}-${season}`}>
            {season === 'Spring' && (
            <FilterButton
              filterTerms={filterTerms}
              year={year}
              setFilterSemesters={setFilterTerms}
              allSemesters={allSemesters}
            />
            )}
            <input
              type="checkbox"
              checked={filterTerms.includes(semesterToTerm({ year, season }))}
              onChange={(e) => {
                const term = semesterToTerm({ year, season });
                if (e.target.checked) {
                  setFilterTerms([...filterTerms, term]);
                } else {
                  setFilterTerms(filterTerms.filter((t) => t !== term));
                }
              }}
            />
          </Fragment>
        ))}
      </div>

      {/* search bar */}
      <div>
        <input
          type="text"
          placeholder="Search for a classmate"
          className="block w-full rounded-lg bg-gray-secondary px-3 py-2"
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

        <p className="mt-2 text-center text-xs sm:text-left">
          {filterTerms.length === 0 ? (
            'Searching profiles. Pick a semester to search schedules.'
          ) : (
            'Searching schedules. Clear semesters to search profiles.'
          )}
        </p>
      </div>

      <ul className="flex flex-wrap items-start gap-4">
        {profiles.filter((profile) => matchIds === null || matchIds.includes(profile.id)).map((profile) => (
          <li key={profile.id} className="space-y-4 rounded-lg bg-gray-secondary px-3 py-1.5">
            {filterTerms.length === 0 ? <UserHeader profile={profile} /> : <ProfileCard profile={profile} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterButton({
  filterTerms, season, year, setFilterSemesters, allSemesters,
}: {
  filterTerms: Term[];
  season?: string;
  year?: number;
  setFilterSemesters: (terms: Term[]) => void;
  allSemesters: Semester[];
}): JSX.Element {
  const key = season ? 'season' : 'year';
  const value = season || year;

  return (
    <button
      type="button"
      className="interactive mx-1 my-0.5 rounded-lg bg-gray-secondary px-2 py-1 text-sm"
      onClick={() => {
        const exists = filterTerms.some((term) => termToSemester(term)[key] === value);
        if (exists) {
          setFilterSemesters(filterTerms.filter((term) => termToSemester(term)[key] !== value));
        } else {
          setFilterSemesters([
            ...filterTerms,
            ...allSemesters.filter((semester) => semester[key] === value).map(semesterToTerm),
          ]);
        }
      }}
    >
      {value}
    </button>
  );
}

function useLunrIndex(profiles: WithId<UserProfile & { currentSchedules: BaseSchedule[]; }>[]) {
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

  return lunrIndex;
}

function ProfileCard({
  profile,
}: {
  profile: WithId<UserProfile & { currentSchedules: BaseSchedule[]; }>;
}): JSX.Element {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex items-center justify-between space-x-2">
            <UserHeader profile={profile} />
            <FaAngleDown className={classNames(open && 'rotate-180')} />
          </Disclosure.Button>

          <Disclosure.Panel>
            <p>
              {profile.bio || "This user hasn't written a bio yet."}
            </p>
            {profile.currentSchedules.length > 0 && (
              <ul className="mt-2 space-y-2">
                {profile.currentSchedules.map((schedule) => (
                  <li key={schedule.id}>
                    <ProfileSchedules profile={profile} schedule={schedule} />
                  </li>
                ))}
              </ul>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

function ProfileSchedules({
  profile,
  schedule,
} : {
  profile: WithId<UserProfile & { currentSchedules: BaseSchedule[]; }>;
  schedule: BaseSchedule;
}) {
  // previously would collapse if user had more than two schedules
  if (false && profile.currentSchedules.length > 2) {
    return (
      <details>
        <summary className="mb-2 cursor-pointer font-medium">
          {schedule.title}
        </summary>
        <ScheduleSection schedule={schedule} hideHeader noPadding />
      </details>
    );
  }

  return (
    <>
      <h4 className="mb-2 font-medium">
        {schedule.title}
      </h4>
      <ScheduleSection schedule={schedule} hideHeader noPadding />
    </>
  );
}

function UserHeader({
  profile,
}: {
  profile: WithId<UserProfile & { currentSchedules: BaseSchedule[]; }>
}) {
  return (
    <h4 title={profile.username!}>
      <Link href={`/user/${profile.username}`} className="interactive">
        {getDisplayName(profile)}
      </Link>
      {' '}
      &middot;
      {' '}
      {profile.classYear}
    </h4>
  );
}

