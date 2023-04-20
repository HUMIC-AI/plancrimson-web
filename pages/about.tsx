import ExternalLink from '@/components/ExternalLink';
import Layout from '@/components/Layout/Layout';

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
  ['Deez Classes', 'https://www.deezclasses.com/?F22=false'],
  ['classes.wtf', 'https://classes.wtf/'],
];

const siteInfoLinks = [
  ['React', 'https://reactjs.org/'],
  ['Next.js', 'https://nextjs.org/'],
  ['TypeScript', 'https://www.typescriptlang.org/'],
  ['Tailwind CSS', 'https://tailwindcss.com/'],
  ['Three.js', 'https://threejs.org/'],
  ['Redux (Toolkit)', 'https://redux-toolkit.js.org/'],
  ['MeiliSearch', 'https://www.meilisearch.com/'],
  ['Firebase', 'https://firebase.google.com/'],
  ['DigitalOcean', 'https://www.digitalocean.com/'],
  ['Vercel', 'https://vercel.com/'],
  ['NameCheap', 'https://www.namecheap.com/'],
];

const AboutPage: React.FC = function () {
  return (
    <Layout>
      <div className="mx-auto max-w-md space-y-4">
        <h1>
          About
        </h1>
        <p>
          Thanks for using Plan Crimson! Reach out with any feedback, questions,
          bug reports, requests, etc. at alexcai [at] college [dot] harvard
          [dot] edu.
        </p>
        <Resources />
        <TechStack />
      </div>
    </Layout>
  );
};

export default AboutPage;

function Resources() {
  return (
    <>
      <h2>
        Other Resources
      </h2>
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
      <ul className="list-inside list-disc">
        {links.map(([name, href]) => (
          <li key={href}>
            <ExternalLink href={href}>{name}</ExternalLink>
          </li>
        ))}
      </ul>
    </>
  );
}

function TechStack() {
  return (
    <>
      <h2>
        About this site
      </h2>
      <p>Here&apos;s some of the tech this site was built with:</p>
      <ul className="list-inside list-disc">
        {siteInfoLinks.map(([name, href]) => (
          <li key={href}>
            <ExternalLink href={href}>{name}</ExternalLink>
          </li>
        ))}
      </ul>
      <p>I am not affiliated with any of the above organizations.</p>
    </>
  );
}

