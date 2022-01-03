import ExternalLink from '../components/ExternalLink';
import Layout from '../components/Layout/Layout';

const PrivacyPage = function () {
  return (
    <Layout>
      <div className="max-w-sm mx-auto space-y-4">
        <p>
          Plan Crimson processes user course selections to provide its service.
          Users&apos; course selections are stored in Firebase, which is owned by
          Google. You can view their privacy information
          {' '}
          <ExternalLink href="https://firebase.google.com/support/privacy/">
            via this link
          </ExternalLink>
          .
        </p>
        <p>
          Plan Crimson requires users to be signed in through their official
          Harvard College Gmail account in order to restrict access to current
          Harvard College students and uniquely identify users. No other user
          information is collected.
        </p>
      </div>
    </Layout>
  );
};

export default PrivacyPage;