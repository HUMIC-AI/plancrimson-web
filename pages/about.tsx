import ExternalLink from '../components/ExternalLink';
import Layout from '../components/Layout/Layout';

const links: [string, string][] = [
  ['Harvard College Student Handbook', 'https://handbook.college.harvard.edu/'],
  ['Harvard Syllabus Explorer', 'https://syllabus.harvard.edu/'],
  ['CS Advising Site', 'https://csadvising.seas.harvard.edu/'],
  [
    'SEAS Four Year Course Plan',
    'https://info.seas.harvard.edu/courses/#/multiYearPlan',
  ],
  ['Vericlass', 'https://vericlass.net/'],
  ['WhatClass', 'https://www.whatclass.net/'],
  ['Curricle', 'https://curricle.berkman.harvard.edu/#/home'],
  ['Coursicle', 'https://www.coursicle.com/harvard/'],
];

const siteInfoLinks = [
  ['React', 'https://reactjs.org/'],
  ['Next.js', 'https://nextjs.org/'],
  ['TypeScript', 'https://www.typescriptlang.org/'],
  ['Tailwind CSS', 'https://tailwindcss.com/'],
  ['MeiliSearch', 'https://www.meilisearch.com/'],
  ['Firebase', 'https://firebase.google.com/'],
  ['DigitalOcean', 'https://www.digitalocean.com/'],
  ['Vercel', 'https://vercel.com/'],
];

const AboutPage: React.FC = function () {
  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl leading-loose font-semibold">
          About this site
        </h1>
        <p>Here&apos;s some of the tech this site was built with:</p>
        <ul className="list-disc list-inside">
          {siteInfoLinks.map(([name, href]) => (
            <li key={href}>
              <ExternalLink href={href}>{name}</ExternalLink>
            </li>
          ))}
        </ul>
        <p>I am not affiliated with any of the above organizations.</p>
        <p>
          Thanks for using Plan Crimson! Reach out with any feedback, questions,
          bug reports, requests, etc. at alexcai [at] college [dot] harvard
          [dot] edu.
        </p>
        <h1 className="text-2xl leading-loose font-semibold">
          Other Resources
        </h1>
        <p>
          The data for Plan Crimson is taken from the
          {' '}
          <ExternalLink href="https://my.harvard.edu/">my.harvard</ExternalLink>
          {' '}
          Course Catalog. Evaluations from Fall 2019 and onwards are from
          {' '}
          <ExternalLink href="https://qreports.fas.harvard.edu/">
            QReports
          </ExternalLink>
          {' '}
          and evaluations from before then are from the old
          {' '}
          <ExternalLink href="https://course-evaluation-reports.fas.harvard.edu/fas/list">
            Course Evaluations
          </ExternalLink>
          {' '}
          site. Here&apos;s some other useful sites for planning out your
          concentration!
        </p>
        <ul className="list-disc list-inside">
          {links.map(([name, href]) => (
            <li key={href}>
              <ExternalLink href={href}>{name}</ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default AboutPage;
