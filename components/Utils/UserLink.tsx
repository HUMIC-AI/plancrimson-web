import Link from 'next/link';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { classNames } from '@/src/utils/styles';


export function UserLink({ uid }: { uid: string }) {
  return <Link href={`/user/${uid}`}>{uid}</Link>;
}


export function ImageWrapper({ url, alt, size = 'sm' }: { url: string | null | undefined, alt: string, size?: 'sm' | 'md' }) {
  if (url) {
    return (
      <Image
        className={classNames(
          size === 'sm' ? 'h-8 w-8' : 'h-16 w-16',
          'rounded-full',
        )}
        src={url}
        alt={alt}
        width={size === 'sm' ? 32 : 64}
        height={size === 'sm' ? 32 : 64}
      />
    );
  }

  return (
    <FaUser className={classNames(
      size === 'sm' ? 'h-8 w-8 p-1' : 'h-16 w-16 p-2',
      'text-white bg-primary-dark rounded-full',
    )}
    />
  );
}

