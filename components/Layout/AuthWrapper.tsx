import { Auth } from '@/src/features';
import { useElapsed } from '@/src/utils/hooks';
import { LoadingBars } from './LoadingPage';
import { signInUser } from './useSyncAuth';
import { WithMeili } from './WithMeili';
import { ErrorMessage } from './ErrorMessage';

/**
 * Wraps around the main content of the page.
 */
export function AuthWrapper({ children, meili }: {
  meili?: boolean;
  children: (props: { userId: string }) => JSX.Element
}) {
  const userId = Auth.useAuthProperty('uid');
  const elapsed = useElapsed(5000, []);

  if (userId === null) {
    return (
      <ErrorMessage>
        You are not authorized to access this content!
        {' '}
        <button type="button" onClick={signInUser} className="interactive font-medium">
          Sign in now.
        </button>
      </ErrorMessage>
    );
  }

  if (typeof userId === 'undefined') {
    return (elapsed && <LoadingBars />) as JSX.Element;
  }

  if (meili) {
    return (
      <WithMeili userId={userId}>
        {children({ userId })}
      </WithMeili>
    );
  }

  return children({ userId });
}


