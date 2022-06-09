import Link from 'next/link';

export default function UserLink({ uid }: { uid: string }) {
  return <Link href={`/user/${uid}`}><a>{uid}</a></Link>;
}
