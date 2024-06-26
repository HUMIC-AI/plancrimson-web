import { ChoiceRank } from '../types';

export type Path = {
  href: string;
  name: string;
};

export type Parent = {
  name: string;
  children: Path[];
};

const sitePaths: (Path | Parent)[] = [
  { href: '/explore', name: 'Explore' },
  { href: '/search', name: 'Search' },
  { href: '/', name: 'My Courses' },
  { href: '/connect', name: 'Connect' },
  { href: '/explore/undergrad', name: 'Universe' },
  // {
  //   name: 'Widgets',
  //   children: [
  //     { href: '/search/archive', name: 'Past Courses' },
  //     { href: '/explore/grad', name: 'Grad Courses' },
  //     { href: '/explore/all', name: 'All' },
  //     { href: '/explore/surprise', name: 'Surprise' },
  //   ],
  // },
  { href: '/about', name: 'About' },
];

// if (isDevelopment) {
//   // check if firebase project is running
//   sitePaths.push({ href: 'http://localhost:4000', name: 'Emulators' });
// }

export const PATHS: readonly (Path | Parent)[] = sitePaths;


export const MESSAGES = {
  meiliClient: 'There was an error getting the search client. Please try again later',
  login: 'You must be logged in to access this!',
  description: 'Wait no longer to plan out your concentration. For Harvard College students. Q Reports, Course Evaluations, my.harvard, and more, all in one place.',
};

export const CHOICE_KEYS: Record<number, ChoiceRank> = {
  37: -1, // left arrow key
  39: 1, // right arrow key
  32: 0, // space bar
};
