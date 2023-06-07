import { Auth } from '@/src/features';
import Layout from '@/components/Layout/Layout';
import { useEffect, useMemo, useState } from 'react';
import Schema from '@/src/schema';
import { onSnapshot } from 'firebase/firestore';
import { UserProfile, WithId } from '@/src/types';

export default function FriendsPage() {
  const userId = Auth.useAuthProperty('uid');

  if (!userId) return <Layout title="Friends" />;

  return (
    <Layout title="Friends">
      <div className="mx-auto max-w-3xl">
        <MainPage userId={userId} />
      </div>
    </Layout>
  );
}


function MainPage({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<WithId<UserProfile>[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(Schema.Collection.profiles(), (snap) => {
      setProfiles(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <ul>
        {profiles.map((profile) => (
          <li key={profile.id}>
            {profile.displayName}
          </li>
        ))}
      </ul>
    </div>
  );
}
