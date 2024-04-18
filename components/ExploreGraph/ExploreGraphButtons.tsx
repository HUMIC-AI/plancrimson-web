import { Fragment, useState } from 'react';
import { Disclosure, RadioGroup } from '@headlessui/react';
import { FaCog } from 'react-icons/fa';
import { EMOJI_SCALES, Graph, toolIcons } from './Graph';
import { CuteSwitch } from '../Utils/CuteSwitch';
import { Subject, choose, getSubjectColor } from '../../src/lib';
import { classNames } from '../../src/utils/styles';
import { useClasses } from '../../src/utils/schedules';

export function Buttons({
  graph, subjects,
}: { graph: Graph; subjects: Subject[]; }) {
  const [myTool, setMyTool] = useState(graph.mode);
  const fixedClasses = useClasses(graph.fixedScheduleId);

  return graph.phase === 'ready' ? (
    <div className="absolute right-full top-16 mr-4 text-right text-sm">
      <Disclosure>
        <Disclosure.Button className="interactive ml-auto flex items-center p-1">
          <span className="mr-1 font-semibold">Options</span>
          <FaCog size={20} />
        </Disclosure.Button>
        <Disclosure.Panel className="mt-1 flex flex-col items-stretch space-y-1 rounded transition-colors hover:bg-gray-secondary/50">
          <div className="flex justify-between">
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
              className="button ml-1 flex-1 bg-primary/80 text-secondary"
              onClick={() => graph.resetZoom()}
            >
              Reset zoom
            </button>
          </div>

          <RadioGroup
            value={myTool}
            onChange={(m) => {
              setMyTool(m);
              graph.setMode(m);
            }}
          >
            {Graph.TOOLS.map((tool) => (
              <div key={tool} className="flex items-center space-x-2">
                <RadioGroup.Option
                  value={tool}
                  className={({ checked }) => classNames(
                    'button',
                    checked ? 'bg-primary/80 text-secondary' : 'bg-secondary text-primary',
                  )}
                >
                  {toolIcons[tool]}
                </RadioGroup.Option>
                <span>
                  {tool}
                </span>
              </div>
            ))}
          </RadioGroup>

          <div className="flex items-center">
            <CuteSwitch
              enabled={graph.rating === 'meanHours'}
              onChange={(checked) => graph.setRatingType(checked ? 'meanHours' : 'meanRating')}
            />
            <span className="ml-2 whitespace-nowrap">
              {graph.rating === 'meanRating' ? 'Average rating' : 'Average workload'}
            </span>
          </div>
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
