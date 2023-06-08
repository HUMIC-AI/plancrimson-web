import { onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ErrorPage } from '@/components/Layout/ErrorPage';
import Schema from '@/src/schema';
import { FaEdit } from 'react-icons/fa';
import type { UserProfile, WithId } from '@/src/types';

type Props = { uid: string; pageProfile: WithId<UserProfile>; };

export function BioSection({ uid, pageProfile }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <h3 className="flex items-center">
        Bio
        {pageProfile.id === uid && (
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="ml-2"
        >
          <FaEdit />
        </button>
        )}
      </h3>

      {/* show an editable textarea for own page, otherwise other's bio */}
      {editing ? <EditBioForm uid={uid} setEditing={setEditing} /> : (
        <p className="mt-2">
          {pageProfile.bio || 'This user has not written a bio.'}
        </p>
      )}
    </>
  );
}

function EditBioForm({ uid, setEditing }: { uid: string; setEditing: (b: boolean) => void; }) {
  const [bio, setBio] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      Schema.profile(uid),
      (snap) => {
        setBio(snap.data()?.bio ?? '');
      },
      (err) => {
        setError(err);
      },
    );
    return () => unsub();
  }, [uid]);

  if (error) {
    return <ErrorPage>{error.message}</ErrorPage>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const update = updateDoc(Schema.profile(uid), { bio });
          const timer = new Promise((resolve) => {
            setTimeout(resolve, 500);
          });
          await Promise.all([update, timer]);
        } catch (err) {
          setError(err as Error);
        }
        setEditing(false);
        // can ignore setLoading since component will unmount
      }}
    >
      <textarea
        className="mt-2 h-32 w-full rounded border-2 px-1"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <button
        type="submit"
        className="interactive mt-2 rounded bg-blue-dark px-2 py-1 text-white"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
