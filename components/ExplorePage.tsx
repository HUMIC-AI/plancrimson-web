import { connectInfiniteHits } from 'react-instantsearch-dom';
import type { ExtendedClass } from 'plancrimson-utils';
import { sampleCourses } from 'plancrimson-utils';
import { useElapsed } from '@/src/utils/hooks';
import { MeiliContext } from '@/src/context/meili';
import { Auth } from '@/src/features';
import Layout, { errorMessages } from '@/components/Layout/Layout';
import { ErrorMessage } from '@/components/Layout/ErrorPage';
import { LoadingBars } from '@/components/Layout/LoadingPage';
import AttributeMenu from '@/components/SearchComponents/AttributeMenu/AttributeMenu';
import ChartComponent from '@/components/Chart/ChartComponent';
import { AuthRequiredInstantSearchProvider } from '@/pages/AuthRequiredInstantSearchProvider';

const Chart = connectInfiniteHits(ChartComponent);

/**
 * @deprecated
 * Still kept around as an example for D3 usage.
 */
export default function ExplorePage() {
  const userId = Auth.useAuthProperty('uid');

  const elapsed = useElapsed(1000, []);

  if (typeof userId === 'undefined') {
    return (
      <Layout>
        {elapsed && <LoadingBars />}
      </Layout>
    );
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
            return (
              <Layout>
                {elapsed && <LoadingBars />}
              </Layout>
            );
          }

          return (
            <AuthRequiredInstantSearchProvider hitsPerPage={50}>
              <div className="flex flex-col space-x-2 md:absolute md:inset-2 md:flex-row">
                <AttributeMenu showSubjectColor />
                <Chart demo={false} client={client} />
              </div>
            </AuthRequiredInstantSearchProvider>
          );
        }}
      </MeiliContext.Consumer>
    </Layout>
  );
}
