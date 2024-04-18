import { classNames } from '@/src/utils/styles';
import { Tab } from '@headlessui/react';
import { ExtendedClass } from '@/src/lib';
import React from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import EvaluationsPanel from './Tabs/EvaluationsPanel';
import InfoPanel from './Tabs/InfoPanel';
import PlanningPanel from './Tabs/PlanningPanel';
import SocialPanel from './Tabs/SocialPanel';
import { useEvaluations } from './Tabs/useEvaluations';

const TABS = ['Description', 'Evaluations', 'Plan', 'Social'];

/**
 * The tabs for the opened course modal.
 * @param course the active course in the modal
 */
export default function CourseCardTabs({ course }: { course: ExtendedClass }) {
  const [evaluations, error] = useEvaluations(course.SUBJECT, course.CATALOG_NBR);

  return (
    <Tab.Group
      defaultIndex={0}
      onChange={(index) => {
        const analytics = getAnalytics();
        logEvent(analytics, 'course_tab_change', {
          subject: course.SUBJECT,
          catalogNumber: course.CATALOG_NBR,
          tab: TABS[index],
        });
      }}
    >
      <Tab.List className="flex overflow-auto">
        {TABS.map(
          (tab) => {
            const disabled = tab === 'Evaluations' && evaluations ? evaluations.length === 0 : false;

            return (
              <Tab
                key={tab}
                disabled={disabled}
                className={({ selected }) => classNames(
                  selected ? 'bg-gray-secondary' : (
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-primary transition-colors'
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

      <Tab.Panels className="overflow-hidden rounded-b-xl bg-gray-secondary p-6 lg:rounded-b-2xl">
        <InfoPanel course={course} />

        {error ? (
          <Tab.Panel>
            {error.code === 'permission-denied' ? (
              <p>You need to be logged in to access this!</p>
            ) : (
              <p>
                An unexpected error occurred loading evaluations!
              </p>
            )}
          </Tab.Panel>
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
