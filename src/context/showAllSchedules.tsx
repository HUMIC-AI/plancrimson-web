import React, {
  createContext, useContext,
} from 'react';
import { throwMissingContext } from '../../shared/util';

type ShowAllSchedulesContextType = {
  showAllSchedules: boolean;
  setShowAllSchedules: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ShowAllSchedulesContext = createContext<ShowAllSchedulesContextType>({
  showAllSchedules: false,
  setShowAllSchedules: throwMissingContext,
});

const useShowAllSchedules = () => useContext(ShowAllSchedulesContext);

export default useShowAllSchedules;
