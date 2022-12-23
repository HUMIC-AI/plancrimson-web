import axios from 'axios';
import { ImageWrapper } from 'components/UserLink';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProfiles, useElapsed } from 'src/hooks';

export default function FindClassmates() {
  const suggestedProfiles = useSuggestedProfiles();
  const ids = useMemo(() => suggestedProfiles?.map(([id]) => id), [suggestedProfiles]);
  const profiles = useProfiles(ids);
  const elapsed = useElapsed(500, []);

  if (typeof suggestedProfiles === 'undefined' || typeof profiles === 'undefined') {
    if (elapsed) return <p>Loading...</p>;
    return null;
  }

  if (suggestedProfiles.length === 0) {
    return <p>No users found yet. Create some schedules to meet classmates!</p>;
  }

  return (
    <ul className="flex flex-wrap justify-around">
      {suggestedProfiles.map(([profileId, numSharedCourses]) => {
        const profile = profiles[profileId];
        return (
          <li key={profileId}>
            <Link href={profile ? `/user/${profile.username}` : '#'} className="interactive m-2 block rounded-xl bg-gray-300 px-4 py-2 shadow">
              <div className="flex items-center space-x-4">
                <ImageWrapper url={profile?.photoUrl} alt="User profile" />
                <div>
                  <span className="font-bold">{profile?.username || 'Loading...'}</span>
                  <p>
                    {numSharedCourses}
                    {' '}
                    courses in common
                  </p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}


function useSuggestedProfiles() {
  // a list of user ids and the number of courses in common
  const [profiles, setProfiles] = useState<[string, number][]>();

  useEffect(() => {
    const lastUpdated = parseInt(sessionStorage.getItem('suggestProfiles/lastUpdated')!, 10);
    const profilesData = sessionStorage.getItem('suggestProfiles/profiles');

    let stale = isNaN(lastUpdated) || Date.now() - lastUpdated > 1000; // every hour

    if (!stale) {
      try {
        const data = JSON.parse(profilesData!);
        if (Object.entries(data).every(([a, b]) => typeof a === 'string' && (b as string[]).every((t) => typeof t === 'string'))) {
          setProfiles(data);
        } else {
          stale = true;
        }
      } catch (err) {
        stale = true;
      }
    }

    if (stale) {
      const user = getAuth().currentUser;
      if (!user) {
        console.error('not signed in');
        return;
      }
      user.getIdToken(true)
        .then((token) => axios({ url: '/api/suggestProfiles', headers: { authorization: `Bearer ${token}` } }))
        .then(({ data }) => {
          sessionStorage.setItem('suggestProfiles/lastUpdated', Date.now().toString());
          sessionStorage.setItem('suggestProfiles/profiles', JSON.stringify(data));
          setProfiles(data);
        })
        .catch((err) => {
          console.error('error getting suggested profiles:', err);
        });
    }
  }, []);

  return profiles;
}