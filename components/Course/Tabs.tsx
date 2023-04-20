import { classNames } from '@/src/utils';
import { Tab } from '@headlessui/react';
import { ExtendedClass, allTruthy } from 'plancrimson-utils';
import React from 'react';
import EvaluationsPanel from './Tabs/EvaluationsPanel';
import InfoPanel from './Tabs/InfoPanel';
import PlanningPanel from './Tabs/PlanningPanel';
import SocialPanel from './Tabs/SocialPanel';

/**
 * The tabs for the opened course modal.
 * @param course the active course in the modal
 */
export default function Tabs({ course }: { course: ExtendedClass }) {
  return (
    <Tab.Group defaultIndex={0}>
      <Tab.List className="flex overflow-auto bg-black">
        {allTruthy(['Description', 'Evaluations', 'Plan', 'Social']).map(
          (tab) => (
            <Tab
              key={tab}
              className={({ selected }) => classNames(
                selected
                  ? 'bg-blue-light text-white'
                  : 'bg-white text-black interactive',
                'flex-1 text-sm py-2 px-4 rounded-t-xl font-medium whitespace-nowrap',
              )}
            >
              {tab}
            </Tab>
          ),
        )}
      </Tab.List>
      <Tab.Panels className="border-t-4 border-blue-light bg-white p-6">
        <InfoPanel course={course} />
        <EvaluationsPanel course={course} />
        <PlanningPanel course={course} />
        <SocialPanel course={course} />
      </Tab.Panels>
    </Tab.Group>
  );
}
