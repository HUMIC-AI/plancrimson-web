import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';

type UserContextType = {
  user?: User | null;
  error?: Error,
};

export const alertSignIn = () => alert('Sign in to search for courses!');

export const UserContext = createContext<UserContextType>({});

export const UserProvider: React.FC = function ({ children }) {
  const [user, setUser] = useState<User | null | undefined>();
  const [authError, setAuthError] = useState<Error | undefined>();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
    }, (err) => {
      setAuthError(err);
    });
    return unsub;
  }, []);

  const value = useMemo<UserContextType>(() => ({
    user,
    error: authError,
  } as UserContextType), [user, authError]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => useContext(UserContext);

export default useUser;
