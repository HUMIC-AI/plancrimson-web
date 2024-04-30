import {
  Fragment, PropsWithChildren, ReactNode, useState,
} from 'react';
import { Disclosure, RadioGroup } from '@headlessui/react';
import {
  FaCheckCircle, FaChevronDown, FaCircle, FaInfoCircle, FaMapMarker, FaRedo, FaSearch, FaSync, FaUndo,
} from 'react-icons/fa';
import { EMOJI_SCALES, Graph } from './Graph';
import { classNames } from '../../src/utils/styles';
import { useClasses } from '../../src/utils/schedules';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { getRandomRatedCourse } from '../../src/utils/utils';
import { useGraphContext } from '../../src/context/GraphProvider';

export function ExploreGraphButtons() {
  const { graph, phase } = useGraphContext();
  const [shortcuts, showShortcuts] = useState(false);

  if (!graph) return null;

  return phase === 'ready' ? (
    <Disclosure defaultOpen>
      {({ open }) => (
        <>
          <Disclosure.Button className="interactive secondary ml-auto flex items-center rounded px-2 py-1">
            <span className="mr-1 font-semibold">Menu</span>
            <FaChevronDown className={classNames(open && 'rotate-180', 'transition duration-200')} />
          </Disclosure.Button>

          <div className="absolute right-0 top-full mt-1 text-sm">
            <Disclosure.Panel className="flex flex-col items-stretch space-y-4 rounded bg-gray-secondary/50 p-2 transition-colors">
              <GraphButtons />

              <MenuRadio
                label="Tools"
                value={graph.tool}
                onChange={(m) => graph.setTool(m)}
                values={Graph.TOOL_MENU}
                icons={Graph.TOOLS}
                shortcuts={shortcuts ? Graph.TOOL_SHORTCUTS : undefined}
              />

              {!graph.target && (
              <MenuRadio
                label="Courses"
                value={graph.isMatchFilter ? 'Search results' : 'All courses'}
                onChange={(m) => {
                  graph.setMatchFilter(m === 'Search results');
                }}
                values={['All courses', 'Search results']}
                shortcuts={shortcuts ? { 'All courses': 'A', 'Search results': 'S' } : undefined}
              />
              )}

              <MenuRadio
                label="Emojis"
                value={graph.rating === 'meanRating' ? 'Q Rating' : 'Workload'}
                onChange={(m) => graph.setRatingType(m === 'Q Rating' ? 'meanRating' : 'meanHours')}
                values={['Q Rating', 'Workload']}
                shortcuts={shortcuts ? { 'Q Rating': 'Q', Workload: 'W' } : undefined}
              />

              <div className="text-right">
                <button type="button" className="interactive rounded text-xs" onClick={() => showShortcuts(!shortcuts)}>
                  {shortcuts ? 'Hide shortcuts' : 'Show shortcuts'}
                </button>
              </div>
            </Disclosure.Panel>


            <EmojiLegend />
          </div>
        </>
      )}
    </Disclosure>
  ) : null;
}

function EmojiLegend() {
  const graph = useGraphContext().graph!;

  return (
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
  );
}

function GraphButtons() {
  const graph = useGraphContext().graph!;
  const fixedClasses = useClasses(graph.fixedScheduleId ?? null);

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

  return (
    <div className="flex flex-col items-end font-medium">
      <Button title="Help" onClick={() => graph.focusCourse(null, 'fix')}>
        <FaInfoCircle />
      </Button>

      <Button title="Reset graph" onClick={handleReset}>
        <FaSync />
      </Button>

      <Button title="Center zoom" onClick={() => graph.resetZoom()}>
        <FaSearch />
      </Button>

      {graph.target && (
      <Button title="Use hint" onClick={() => graph.focusHint()}>
        <FaMapMarker />
      </Button>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          disabled={!graph.undoable}
          onClick={() => graph.undo()}
          className="enabled:interactive flex items-center space-x-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaUndo />
          <span>
            Undo
          </span>
        </button>

        <button
          type="button"
          disabled={!graph.redoable}
          onClick={() => graph.redo()}
          className="enabled:interactive flex items-center space-x-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            Redo
          </span>
          <FaRedo />
        </button>
      </div>
    </div>
  );
}

function Button({
  title, onClick, children,
}: PropsWithChildren<{
  title: string;
  onClick: any;
}>) {
  return (
    <button
      type="button"
      title={title}
      className="interactive flex items-center space-x-1"
      onClick={onClick}
    >
      <span className="whitespace-nowrap">
        {title}
      </span>
      {children}
    </button>
  );
}

function MenuRadio<T extends string>({
  label, value, onChange, values, icons, shortcuts,
}: {
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
  values: readonly T[];
  shortcuts?: Record<T, string>;
  icons?: Record<T, { icon: ReactNode }>;
}) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      className="flex flex-col"
    >
      <RadioGroup.Label className="mb-1 border-b text-right font-semibold">
        {label}
      </RadioGroup.Label>

      {values.map((tool) => (
        <div key={tool} className="flex items-center justify-end">
          {shortcuts && (
          <span className="flex-1">
            <kbd>
              {shortcuts[tool]}
            </kbd>
          </span>
          )}

          <RadioGroup.Option
            key={tool}
            value={tool}
            className={({ checked }) => classNames(
              'interactive flex items-center rounded',
              icons && checked && 'ring ring-offset-1',
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
        </div>
      ))}
    </RadioGroup>
  );
}

