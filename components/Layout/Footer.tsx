import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { unsplashParams } from '@/src/lib';
import ExternalLink from '../Utils/ExternalLink';


export function Footer() {
  const { query } = useRouter();

  return (
    <footer className="bg-black">
      <div className="container mx-auto flex flex-col space-y-1 p-4 text-center text-xs text-white sm:text-sm">
        <span>Course data last updated 2023-01-03</span>
        <span>
          &#169; 2023 Alexander Cai | alexcai [at] college |
          {' '}
          <ExternalLink href="https://account.venmo.com/u/Alexander-Cai-1">
            Buy me a coffee
          </ExternalLink>
        </span>
        <span>
          Logo
          {' '}
          <ExternalLink href="https://fontawesome.com/license">
            &#169; 2018 FontAwesome
          </ExternalLink>
          {' '}
          | Images from
          {' '}
          <ExternalLink href={`https://unsplash.com/${unsplashParams}`}>
            Unsplash
          </ExternalLink>
          {' '}
          |
          {' '}
          <Link
            href={{
              pathname: '/privacy',
              query,
            }}
            className="interactive font-bold"
          >
            Attributions
          </Link>
        </span>
        <span>
          Course metadata and evaluations
          {' '}
          <ExternalLink href="https://www.harvard.edu/">
            &#169; 2023 The President and Fellows of Harvard College
          </ExternalLink>
        </span>
        <span>
          Data is not guaranteed to match
          {' '}
          <ExternalLink href="https://my.harvard.edu/">
            my.harvard
          </ExternalLink>
        </span>
        <span>
          <Link
            href={{
              pathname: '/privacy',
              query,
            }}
            className="interactive font-bold"
          >
            Privacy
          </Link>
        </span>
      </div>
    </footer>
  );
}
