import { departmentImages, unsplashParams } from 'plancrimson-utils';
import ExternalLink from '@/components/Utils/ExternalLink';
import Layout from '@/components/Layout/Layout';

const PrivacyPage = function () {
  return (
    <Layout title="Privacy">
      <div className="mx-auto max-w-lg space-y-4">
        <h1>Privacy</h1>
        <p>
          Plan Crimson processes user course selections to provide its service.
          Users&apos; course selections are stored in Firebase, which is owned
          by Google. You can view their privacy information
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
        <h1>
          Image Attributions
        </h1>
        <p>
          All images are used with permission from
          {' '}
          <ExternalLink href={`https://unsplash.com${unsplashParams}`}>
            Unsplash
          </ExternalLink>
          {' '}
          under the
          {' '}
          <ExternalLink href={`https://unsplash.com/license${unsplashParams}`}>
            Unsplash License
          </ExternalLink>
          . Images are listed next to their department below. If you believe an
          image has been used that does not appropriately represent the respective
          department, please contact me at alexcai [at] college.
        </p>
        <ul className="list-inside list-disc space-y-1">
          {Object.keys(departmentImages)
            .sort()
            .map((department) => {
              const { user, id } = departmentImages[department as keyof typeof departmentImages];
              return (
                <li key={department}>
                  Photo for
                  {' '}
                  <ExternalLink
                    href={`https://unsplash.com/photos/${id}${unsplashParams}`}
                  >
                    {department}
                  </ExternalLink>
                  {' '}
                  by
                  {' '}
                  <ExternalLink href={`${user.links.html}${unsplashParams}`}>
                    {user.name}
                  </ExternalLink>
                </li>
              );
            })}
        </ul>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
