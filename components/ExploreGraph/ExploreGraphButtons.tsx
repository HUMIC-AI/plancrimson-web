import { Fragment, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { FaCog } from 'react-icons/fa';
import { Graph } from './Graph';
import { CuteSwitch } from '../Utils/CuteSwitch';
import { Subject, choose, getSubjectColor } from '../../src/lib';
import { classNames } from '../../src/utils/styles';
import { useClasses } from '../../src/utils/schedules';
import { EMOJI_SCALES } from './HoveredCourseInfo';

export function Buttons({
  graph, subjects,
}: { graph: Graph; subjects: Subject[]; }) {
  const [flip, setToggleFlip] = useState(false);
  const fixedClasses = useClasses(graph.fixedScheduleId);

  return (
    <div className={classNames(
      'absolute right-full top-16 mr-4',
      'flex flex-col items-end space-y-2',
      'rounded-xl transition-colors hover:bg-gray-secondary/50',
    )}
    >
      <Disclosure>
        <Disclosure.Button className="interactive mr-2 mt-2">
          <FaCog size={20} />
        </Disclosure.Button>
        <Disclosure.Panel className="flex flex-col items-end space-y-1 p-1">

          <button
            type="button"
            className="button bg-primary/80 text-secondary"
            onClick={() => {
              if (!fixedClasses) return;
              if (fixedClasses.length > 0) {
                graph.setPhase('init');
                graph.removeNodes(graph.getNodesNotIn(fixedClasses).map((s) => s.id));
                graph.setPhase('wait');
              } else {
                graph.removeNodes(graph.currentData.map((s) => s.id));
                graph.setPhase('init');
                // this sets state to wait
                graph.appendNodes([graph.toDatum(choose(graph.courses).id)!], []);
              }
            }}
          >
            Reset
          </button>

          <button
            type="button"
            className="button bg-primary/80 text-secondary"
            onClick={() => graph.resetZoom()}
          >
            Reset zoom
          </button>

          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">{flip ? 'Opposite' : 'Similar'}</span>
            <CuteSwitch
              enabled={flip}
              onChange={(checked) => {
                graph.setFlip(checked);
                setToggleFlip(checked);
              }}
            />
          </div>

          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">
              {graph.rating === 'meanRating' ? 'Average rating' : 'Average workload'}
            </span>
            <CuteSwitch
              enabled={graph.rating === 'meanHours'}
              onChange={(checked) => graph.setRatingType(checked ? 'meanHours' : 'meanRating')}
            />
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <ul className={classNames(
        'grid grid-flow-col grid-rows-[auto_auto] justify-items-center gap-x-2',
        'rounded-lg border border-primary bg-secondary/80 px-1 pb-1',
        'leading-none',
      )}
      >
        {EMOJI_SCALES[graph.rating].map((emoji, i) => (
          <Fragment key={emoji}>
            <li className="text-2xl">{emoji}</li>
            <li>{graph.rating === 'meanRating' ? i + 1 : `${(i / 5) * 20}+`}</li>
          </Fragment>
        ))}
      </ul>

      <ul className="absolute top-full flex flex-col items-end text-xs">
        {subjects.map((s) => (
          <li
            key={s}
            className="flex items-center"
            onMouseEnter={() => graph.highlightSubject(s)}
            onMouseLeave={() => graph.highlightSubject(null)}
          >
            {s}
            <span className="ml-1 h-2 w-2 rounded-full" style={{ backgroundColor: getSubjectColor(s) }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
