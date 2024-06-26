import ExternalLink from '@/components/Utils/ExternalLink';
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
  ['Classiq', 'https://classiq.red/'],
  ['cs50.courses', 'https://cs50.courses/'],
];

const siteInfoLinks = [
  ['React', 'https://reactjs.org/'],
  ['Next.js', 'https://nextjs.org/'],
  ['TypeScript', 'https://www.typescriptlang.org/'],
  ['Tailwind CSS', 'https://tailwindcss.com/'],
  ['Headless UI', 'https://headlessui.com/'],
  ['Three.js', 'https://threejs.org/'],
  ['Redux (Toolkit)', 'https://redux-toolkit.js.org/'],
  ['MeiliSearch', 'https://www.meilisearch.com/'],
  ['InstantSearch', 'https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/'],
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
          Thanks for using PlanCrimson! Reach out with any feedback, questions,
          bug reports, requests, etc. at alexcai [at] college [dot] harvard
          [dot] edu.
        </p>
        <p>
          Since March 2023, this project is affiliated with
          {' '}
          <ExternalLink href="https://www.harvardai.org/">HUMIC</ExternalLink>
          ,
          the Harvard Undergraduate Machine Intelligence Community!
          If you&rsquo;re a student interested in building these sorts of cool projects,
          be sure to visit our website and join our programs!
        </p>
        <Resources />
        <TechStack />
        <h2>
          About me
        </h2>
        <p>
          <ExternalLink href="https://notes.adzc.ai">
            adzc.ai
          </ExternalLink>
        </p>
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
        The data for PlanCrimson is taken from the
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
      <p>
        The source code for the
        {' '}
        <em>client</em>
        {' '}
        is open source on
        {' '}
        <ExternalLink href="https://github.com/HUMIC-AI/plancrimson-web">
          GitHub
        </ExternalLink>
        !
        Contributions are welcome and appreciated.
      </p>
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

