import Layout from '../components/Layout/Layout';

const links = [
  ['CS Advising Site', 'https://csadvising.seas.harvard.edu/'],
  ['Vericlass', 'https://vericlass.net/'],
  ['WhatClass', 'https://www.whatclass.net/'],
  ['Curricle', 'https://curricle.berkman.harvard.edu/#/home']
];

const ResourcesPage: React.FC = function () {
  return (
    <Layout>
      <p>The data is taken from my.harvard.</p>
      <div>
        <ul>
          {links.map(([name, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer">{name}</a>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
