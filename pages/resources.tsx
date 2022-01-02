import Layout from '../components/Layout/Layout';

const links = [
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
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl leading-loose font-semibold">Other Resources</h1>
        <p>
          Data is taken from the
          {' '}
          <a href="https://my.harvard.edu/" target="_blank" rel="noreferrer" className="hover:opacity-50 transition-opacity font-semibold">my.harvard</a>
          {' '}
          Course Catalog.
        </p>
        <ul className="list-disc list-inside">
          {links.map(([name, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="hover:opacity-50 transition-opacity font-semibold">
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
