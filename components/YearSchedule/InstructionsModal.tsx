import { useModal } from '@/src/context/modal';
import { useMounted } from '@/src/utils/hooks';
import { useEffect } from 'react';
import { FaCog } from 'react-icons/fa';

export function InstructionsModal() {
  const mounted = useMounted();
  if (!mounted) return null;
  return <InstructionsModalComponent />;
}

function InstructionsModalComponent() {
  const { showContents, goBack } = useModal();

  useEffect(() => {
    const seen = localStorage.getItem('seenPlanInstructions') === 'true';

    if (seen) return;

    showContents({
      title: 'Welcome to PlanCrimson!',
      close() {
        localStorage.setItem('seenPlanInstructions', 'true');
        goBack();
      },
      content: (
        <div className="space-y-2 p-4">
          <p>
            Click on the
            {' '}
            <FaCog className="mb-0.5 inline" />
            {' '}
            icon to access additional options, such as making a schedule
            {' '}
            <span className="font-bold">public</span>
            , duplicating it, or deleting it.
          </p>
          <p>
            You can create
            {' '}
            <span className="font-bold">multiple schedules</span>
            {' '}
            per semester.
            Use these to categorize your classes or to plan out different paths.
          </p>
          <p>
            Use the buttons at the top of the page to choose which schedules get displayed.
          </p>
          <p>
            Visit the other pages to explore a web of courses and meet future classmates. Enjoy!
          </p>
        </div>
      ),
    });
  }, [goBack, showContents]);

  return null;
}

