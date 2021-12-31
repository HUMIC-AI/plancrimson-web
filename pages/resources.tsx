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
      <p>
        The data is taken from the
        {' '}
        <a href="https://my.harvard.edu/">my.harvard.edu</a>
        {' '}
        Course Catalog.
      </p>
      <div>
        <ul>
          <li>
            <a href="https://csadvising.seas.harvard.edu/concentration/courses/tags/">
              CS Advising Course Tags
            </a>
          </li>
          {links.map(([name, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer">
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
