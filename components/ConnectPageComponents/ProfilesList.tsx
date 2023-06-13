import ConnectProfileCard from '@/components/ConnectPageComponents/ConnectProfileCard';
import { ProfileWithSchedules } from '@/components/ConnectPageComponents/useLunrIndex';
import { Auth } from '@/src/features';
import { classNames } from '@/src/utils/styles';
import { getDisplayName } from '@/src/utils/utils';
import Link from 'next/link';
import { Fragment } from 'react';

export function ProfilesList({
  profilesOnly, showProfiles, matchIds, friendIds,
}: {
  profilesOnly: boolean;
  showProfiles: ProfileWithSchedules[];
  matchIds: string[] | null;
  friendIds: string[] | undefined;
}) {
  const userId = Auth.useAuthProperty('uid');

  const isFriend = (profile: { id: string; }) => friendIds?.includes(profile.id);

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
                      isFriend(profile) && 'underline',
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
