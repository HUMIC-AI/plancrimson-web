import { Tab } from '@headlessui/react';
import React from 'react';
import { ExtendedClass } from '../../shared/apiTypes';
import { allTruthy, classNames } from '../../shared/util';
import EvaluationsPanel from './Tabs/EvaluationsPanel';
import InfoPanel from './Tabs/InfoPanel';
import PlanningPanel from './Tabs/PlanningPanel';

const Tabs: React.FC<{ course: ExtendedClass }> = function ({ course }) {
  return (
    <Tab.Group defaultIndex={0}>
      <Tab.List className="bg-gray-800 flex overflow-auto">
        {allTruthy(['Description', 'More Info', 'Evaluations', 'Plan']).map(
          (tab) => (
            <Tab
              key={tab}
              className={({ selected }) => classNames(
                selected
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 hover:opacity-50 transition-opacity',
                'flex-1 text-sm py-2 px-4 rounded-t-xl font-medium whitespace-nowrap',
              )}
            >
              {tab}
            </Tab>
          ),
        )}
      </Tab.List>
      <Tab.Panels className="p-6 border-t-4 border-blue-500 bg-white">
        <Tab.Panel>
          <p className="max-w-lg">
            {course.textDescription || 'No description'}
          </p>
        </Tab.Panel>
        <InfoPanel course={course} />
        <EvaluationsPanel course={course} />
        <PlanningPanel course={course} />
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
