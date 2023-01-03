import Link from 'next/link';
import { ImageWrapper } from 'components/UserLink';
import { UserProfile, WithId } from 'shared/types';

export default function ProfileList({ profiles, Button }: { profiles: Array<WithId<UserProfile>>; Button: React.FC<{ profile: WithId<UserProfile>; }>; }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      {profiles.map((profile) => (
        <li key={profile.id} className="contents">
          <div className="flex items-center">
            <ImageWrapper url={profile.photoUrl} alt="User profile" />
            <Link href={`/user/${profile.username}`} className="ml-2 font-bold">
              {profile.username}
            </Link>
          </div>

          <div>
            <Button profile={profile} />
          </div>
        </li>
      ))}
    </div>
  );
}
