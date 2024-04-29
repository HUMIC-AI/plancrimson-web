import { Fragment, ReactNode } from 'react';
import { Disclosure, RadioGroup } from '@headlessui/react';
import {
  FaCheckCircle, FaChevronDown, FaCircle,
} from 'react-icons/fa';
import { EMOJI_SCALES, Graph } from './Graph';
import { classNames } from '../../src/utils/styles';
import { useClasses } from '../../src/utils/schedules';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { getRandomRatedCourse } from '../../src/utils/utils';
import { useGraphContext } from '../../src/context/GraphProvider';

export function ExploreGraphButtons() {
  const { graph, phase } = useGraphContext();
  const fixedClasses = useClasses(graph?.fixedScheduleId ?? null);

  if (!graph) return null;

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
      graph.appendNodesAndLinks([graph.toDatum(graph.initial?.id ?? getRandomRatedCourse(graph.courses).id, GRAPH_SCHEDULE)!], []);
    }
  };

  return phase === 'ready' ? (
    <div className="absolute right-full top-16 mr-4 text-right text-sm">
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="interactive secondary ml-auto flex items-center rounded px-2 py-1">
              <span className="mr-1 font-semibold">Menu</span>
              <FaChevronDown className={classNames(open && 'rotate-180', 'transition duration-200')} />
            </Disclosure.Button>

            <Disclosure.Panel
              className="flex flex-col items-stretch space-y-4 rounded bg-gray-secondary/50 p-2 transition-colors"
            >
              <div className="space-y-1">
                <button
                  type="button"
                  className="button whitespace-nowrap bg-primary/80 py-0.5 text-secondary"
                  onClick={handleReset}
                >
                  Reset graph
                </button>

                <button
                  type="button"
                  className="button whitespace-nowrap bg-primary/80 py-0.5 text-secondary"
                  onClick={() => graph.resetZoom()}
                >
                  Center zoom
                </button>
              </div>

              {graph.target && (
              <button
                type="button"
                className="button whitespace-nowrap bg-blue-primary/80 text-secondary"
                onClick={() => graph.focusHint()}
              >
                Show hint
              </button>
              )}

              <MenuRadio
                label="Tools"
                value={graph.tool}
                onChange={(m) => graph.setTool(m)}
                values={['Select', 'Move', 'Add similar', 'Add opposite', 'Link', 'Erase']}
                icons={Graph.TOOLS}
              />

              {!graph.target && (
              <MenuRadio
                label="Courses"
                value={graph.isMatchFilter ? 'Search results' : 'All courses'}
                onChange={(m) => {
                  graph.setMatchFilter(m === 'Search results');
                }}
                values={['All courses', 'Search results']}
              />
              )}

              <MenuRadio
                label="Emojis"
                value={graph.rating === 'meanRating' ? 'Q Rating' : 'Workload'}
                onChange={(m) => graph.setRatingType(m === 'Q Rating' ? 'meanRating' : 'meanHours')}
                values={['Q Rating', 'Workload']}
              />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <div className="absolute right-0 top-full mt-1">
        <div className="rounded-lg border border-primary bg-secondary/80 px-1 pb-1">
          <ul className="grid grid-flow-col grid-rows-[auto_auto] justify-items-center gap-x-2 leading-none">
            {EMOJI_SCALES[graph.rating].map((emoji, i) => (
              <Fragment key={emoji}>
                <li className="text-2xl">{emoji}</li>
                <li>{graph.rating === 'meanRating' ? i + 1 : `${(i / 5) * 20}+`}</li>
              </Fragment>
            ))}
          </ul>
          <p className="text-center">No emoji = no ratings</p>
        </div>
      </div>
    </div>
  ) : null;
}

function MenuRadio<T extends string>({
  label, value, onChange, values, icons,
}: {
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
  values: readonly T[];
  icons?: Record<T, { icon: ReactNode }>;
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
            'interactive flex items-center',
            checked && 'font-semibold underline',
          )}
        >
          {({ checked }) => (
            <>
              <span className="mr-1 select-none whitespace-nowrap">
                {tool}
              </span>

              {icons ? icons[tool].icon : (checked ? <FaCheckCircle /> : <FaCircle />)}
            </>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}

