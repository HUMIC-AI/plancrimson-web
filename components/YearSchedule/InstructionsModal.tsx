import { useModal } from '@/src/context/modal';
import { useMounted } from '@/src/utils/hooks';
import { useEffect } from 'react';

export default function () {
  const mounted = useMounted();
  if (!mounted) return null;
  return <InstructionsModal />;
}

function InstructionsModal() {
  const { showContents, setOpen } = useModal();

  useEffect(() => {
    const seen = localStorage.getItem('seenPlanInstructions') === 'true';

    if (seen) return;

    showContents({
      title: 'Welcome to PlanCrimson!',
      close() {
        localStorage.setItem('seenPlanInstructions', 'true');
        setOpen(false);
      },
      content: (
        <div className="space-y-2 p-4">
          <p>
            <span className="font-bold">Hover over the title</span>
            {' '}
            of a schedule to access additional options, such as making it
            {' '}
            <span className="font-bold">public</span>
            , duplicating it, or deleting it.
          </p>
          <p>
            Use the buttons at the top of the page to choose which schedules get displayed.
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
            Visit the other pages to explore a web of courses and meet future classmates. Enjoy!
          </p>
        </div>
      ),
    });
  }, [setOpen, showContents]);

  return null;
}

