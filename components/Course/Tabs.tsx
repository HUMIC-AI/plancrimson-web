import { Tab } from '@headlessui/react';
import React from 'react';
import { ExtendedClass } from '../../shared/apiTypes';
import { allTruthy, classNames } from '../../shared/util';
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
      <Tab.List className="flex overflow-auto bg-gray-800">
        {allTruthy(['Description', 'Evaluations', 'Plan', 'Social']).map(
          (tab) => (
            <Tab
              key={tab}
              className={({ selected }) => classNames(
                selected
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 interactive',
                'flex-1 text-sm py-2 px-4 rounded-t-xl font-medium whitespace-nowrap',
              )}
            >
              {tab}
            </Tab>
          ),
        )}
      </Tab.List>
      <Tab.Panels className="border-t-4 border-blue-500 bg-white p-6">
        <InfoPanel course={course} />
        <EvaluationsPanel course={course} />
        <PlanningPanel course={course} />
        <SocialPanel course={course} />
      </Tab.Panels>
    </Tab.Group>
  );
}
