import { InstantSearch, Configure, connectInfiniteHits } from 'react-instantsearch-dom';
import type { ExtendedClass } from 'plancrimson-utils';
import { sampleCourses } from 'plancrimson-utils';
import useSearchState from '@/src/context/searchState';
import { useElapsed } from '@/src/hooks';
import { MeiliContext } from '@/src/meili';
import { Auth } from '@/src/features';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorMessage } from '@/components/Layout/ErrorPage';
import { LoadingPage } from '@/components/Layout/LoadingPage';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu';
import ChartComponent from '@/components/Chart/ChartComponent';

const Chart = connectInfiniteHits(ChartComponent);

export default function ExplorePage() {
  const userId = Auth.useAuthProperty('uid');

  const elapsed = useElapsed(1000, []);

  if (typeof userId === 'undefined') {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  if (userId === null) {
    return (
      <Layout className="md:relative md:flex-1">
        <div className="flex flex-col space-x-2 md:absolute md:inset-2 md:flex-row">
          <AttributeMenu />
          <ChartComponent hits={sampleCourses as ExtendedClass[]} demo client={null} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="md:relative md:flex-1">
      <MeiliContext.Consumer>
        {({ client, error }) => {
          if (error) {
            return <ErrorMessage>{errorMessages.meiliClient}</ErrorMessage>;
          }

          if (!client) {
            if (elapsed) return <LoadingPage />;
            return <Layout />;
          }

          return <ExplorePageInner client={client} />;
        }}
      </MeiliContext.Consumer>
    </Layout>
  );
}

function ExplorePageInner({ client }: { client: InstantSearch }) {
  const { searchState, setSearchState } = useSearchState();

  return (
    <InstantSearch
      indexName="courses"
      searchClient={client}
      searchState={searchState}
      onSearchStateChange={(newState) => {
        setSearchState({ ...searchState, ...newState });
      }}
      stalledSearchDelay={500}
    >
      <Configure hitsPerPage={50} />
      <div className="flex flex-col space-x-2 md:absolute md:inset-2 md:flex-row">
        <AttributeMenu showSubjectColor />
        <Chart demo={false} client={client} />
      </div>
    </InstantSearch>
  );
}
