import { classNames } from '@/src/utils/styles';
import { Tab } from '@headlessui/react';
import { ExtendedClass, allTruthy } from '@/src/lib';
import React from 'react';
import EvaluationsPanel from './Tabs/EvaluationsPanel';
import InfoPanel from './Tabs/InfoPanel';
import PlanningPanel from './Tabs/PlanningPanel';
import SocialPanel from './Tabs/SocialPanel';
import { useEvaluations } from './Tabs/useEvaluations';

/**
 * The tabs for the opened course modal.
 * @param course the active course in the modal
 */
export default function CourseTabs({ course }: { course: ExtendedClass }) {
  const [evaluations, error] = useEvaluations(course.SUBJECT + course.CATALOG_NBR);

  return (
    <Tab.Group defaultIndex={0}>
      <Tab.List className="flex overflow-auto bg-black">
        {allTruthy(['Description', 'Evaluations', 'Plan', 'Social']).map(
          (tab) => {
            const disabled = tab === 'Evaluations' && evaluations ? evaluations.length === 0 : false;

            return (
              <Tab
                key={tab}
                disabled={disabled}
                className={({ selected }) => classNames(
                  selected ? 'bg-white text-black' : (
                    disabled
                      ? 'text-gray-dark cursor-not-allowed'
                      : 'text-white hover:bg-gray-dark transition-colors'
                  ),
                  'flex-1 text-sm py-2 px-4 rounded-t-xl font-medium whitespace-nowrap',
                )}
                title={disabled ? 'No evaluations' : undefined}
              >
                {tab}
              </Tab>
            );
          },
        )}
      </Tab.List>

      <Tab.Panels className="bg-white p-6">
        <InfoPanel course={course} />
        {error ? (
          error.code === 'permission-denied' ? (
            <p>You need to be logged in to access this!</p>
          ) : (
            <p>
              An unexpected error occurred loading evaluations!
            </p>
          )
        ) : (
          evaluations
            ? <EvaluationsPanel evaluations={evaluations} />
            : (
              <Tab.Panel>
                Loading...
              </Tab.Panel>
            )
        )}
        <PlanningPanel course={course} />
        <SocialPanel course={course} />
      </Tab.Panels>
    </Tab.Group>
  );
}
