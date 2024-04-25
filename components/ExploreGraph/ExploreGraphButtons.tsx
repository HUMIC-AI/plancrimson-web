import { Fragment, ReactNode, useState } from 'react';
import { Disclosure, RadioGroup } from '@headlessui/react';
import {
  FaCheckCircle, FaCircle, FaCog,
} from 'react-icons/fa';
import { EMOJI_SCALES, Graph } from './Graph';
import { Subject } from '../../src/lib';
import { classNames, getSubjectColor } from '../../src/utils/styles';
import { useClasses } from '../../src/utils/schedules';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { getRandomRatedCourse } from '../../src/utils/utils';

export function Buttons({
  graph, subjects,
}: { graph: Graph; subjects: Subject[]; }) {
  const [myTool, setMyTool] = useState(graph.mode);
  const fixedClasses = useClasses(graph.fixedScheduleId);
  const [hovered, setHovered] = useState(localStorage.getItem('graphButtonHovered') === 'true');

  const handleReset = () => {
    if (!fixedClasses) return;
    if (fixedClasses.length > 0) {
      graph.setPhase('init');
      graph.removeNodes(graph.getNodesNotIn(fixedClasses).map((s) => s.id));
      graph.setPhase('wait');
    } else {
      graph.removeNodes(graph.currentData.map((s) => s.id));
      graph.setPhase('init');
      // this sets state to wait
      graph.appendNodes([graph.toDatum(getRandomRatedCourse(graph.courses), GRAPH_SCHEDULE)!], []);
    }
  };

  return graph.phase === 'ready' ? (
    <div className="absolute right-full top-16 mr-4 text-right text-sm">
      <Disclosure defaultOpen>
        <Disclosure.Button
          className={classNames(
            'interactive secondary ml-auto flex items-center rounded px-2 py-1',
            !hovered && 'animate-ping',
          )}
          onMouseEnter={() => {
            setHovered(true);
            localStorage.setItem('graphButtonHovered', 'true');
          }}
        >
          <span className="mr-1 font-semibold">Options</span>
          <FaCog size={18} />
        </Disclosure.Button>

        <Disclosure.Panel
          className="mt-1 flex flex-col items-stretch space-y-1 rounded transition-colors hover:bg-gray-secondary/50"
        >
          <button
            type="button"
            className="button whitespace-nowrap bg-primary/80 text-secondary"
            onClick={handleReset}
          >
            Reset graph
          </button>

          <button
            type="button"
            className="button whitespace-nowrap bg-primary/80 text-secondary"
            onClick={() => graph.resetZoom()}
          >
            Center zoom
          </button>

          <MenuRadio
            label="Tool"
            value={myTool}
            onChange={(m) => {
              setMyTool(m);
              graph.setMode(m);
            }}
            values={Graph.TOOLS}
            // icons={toolIcons}
          />

          <MenuRadio
            label="Courses"
            value={graph.isMatchFilter ? 'Match filter' : 'All courses'}
            onChange={(m) => {
              graph.setMatchFilter(m === 'Match filter');
            }}
            values={['All courses', 'Match filter']}
          />

          <MenuRadio
            label="Emojis"
            value={graph.rating === 'meanRating' ? 'Rating' : 'Workload'}
            onChange={(m) => graph.setRatingType(m === 'Rating' ? 'meanRating' : 'meanHours')}
            values={['Rating', 'Workload']}
          />
        </Disclosure.Panel>
      </Disclosure>

      <div className="absolute right-0 top-full mt-1">
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

        <ul className="absolute right-0 top-full mt-1 flex flex-col items-end text-xs">
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
    </div>
  ) : null;
}

function MenuRadio<T extends string>({
  label, value, onChange, values,
}: {
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
  values: readonly T[];
}) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      className="flex flex-col items-end"
    >
      <RadioGroup.Label className="border-b font-semibold">
        {label}
      </RadioGroup.Label>

      {values.map((tool) => (
        <RadioGroup.Option
          key={tool}
          value={tool}
          className={({ checked }) => classNames(
            'interactive cursor-pointer flex items-center',
            checked && 'font-semibold',
          )}
        >
          {({ checked }) => (
            <>
              <span className="mr-1 select-none whitespace-nowrap">
                {tool}
              </span>

              {checked ? <FaCheckCircle /> : <FaCircle />}
            </>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}

