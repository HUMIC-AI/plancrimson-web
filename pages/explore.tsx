import { InstantSearch, Configure, connectInfiniteHits } from 'react-instantsearch-dom';
import Layout, { errorMessages } from '../components/Layout/Layout';
import { ErrorPage } from "../components/Layout/ErrorPage";
import { LoadingPage } from "../components/Layout/LoadingPage";
import AttributeMenu from '../components/SearchComponents/AttributeMenu';
import type { ExtendedClass } from '../shared/apiTypes';
import useSearchState from '../src/context/searchState';
import { useElapsed } from '../src/hooks';
import { useMeiliClient } from '../src/meili';
import { Auth } from '../src/features';
import sampleCourses from '../shared/assets/sampleCourses.json';
import ChartComponent from '../components/Chart/ChartComponent'

const Chart = connectInfiniteHits(ChartComponent);

export default function ExplorePage() {
  const { searchState, setSearchState } = useSearchState();
  const userId = Auth.useAuthProperty('uid');
  const { client, error } = useMeiliClient();
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

  if (error) {
    return <ErrorPage>{errorMessages.meiliClient}</ErrorPage>;
  }

  if (!client) {
    if (elapsed) return <LoadingPage />;
    return <Layout />;
  }

  return (
    <Layout className="md:relative md:flex-1">
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
    </Layout>
  );
}

