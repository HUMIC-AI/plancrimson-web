import ExternalLink from '../components/ExternalLink';
import Layout from '../components/Layout/Layout';

const links: [string, string][] = [
  ['Harvard College Student Handbook', 'https://handbook.college.harvard.edu/'],
  ['CS Advising Site', 'https://csadvising.seas.harvard.edu/'],
  ['SEAS Four Year Course Plan', 'https://info.seas.harvard.edu/courses/#/multiYearPlan'],
  ['Vericlass', 'https://vericlass.net/'],
  ['WhatClass', 'https://www.whatclass.net/'],
  ['Curricle', 'https://curricle.berkman.harvard.edu/#/home'],
  ['Coursicle', 'https://www.coursicle.com/harvard/'],
];

const ResourcesPage: React.FC = function () {
  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl leading-loose font-semibold">Other Resources</h1>
        <p>
          Data is taken from the
          {' '}
          <ExternalLink href="https://my.harvard.edu/">my.harvard</ExternalLink>
          {' '}
          Course Catalog. Here&apos;s some other useful sites for planning out your concentration!
        </p>
        <ul className="list-disc list-inside mt-4">
          {links.map(([name, href]) => (
            <li key={href}>
              <ExternalLink href={href}>
                {name}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
