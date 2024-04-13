import { Fragment, useState } from 'react';
import { Schedules } from '../../src/features';
import { useAppDispatch } from '../../src/utils/hooks';
import { EMOJI_SCALE, GraphState } from './initGraph';
import { CuteSwitch } from '../Utils/CuteSwitch';
import { Subject, getSubjectColor } from '../../src/lib';

export function Buttons({
  graph, subjects,
}: { graph: GraphState; subjects: Subject[]; }) {
  const dispatch = useAppDispatch();
  const [flip, setToggleFlip] = useState(false);

  return (
    <div className="absolute right-full top-6 mr-2 flex flex-col items-end justify-center space-y-2">
      <div className="rounded-lg border border-primary bg-secondary/80 p-1.5">
        <p className="text-center font-medium tracking-wide">Average rating</p>
        <ul className="grid grid-flow-col grid-rows-[auto_auto] justify-items-center gap-x-2 leading-none">
          {EMOJI_SCALE.map((emoji, i) => (
            <Fragment key={emoji}>
              <li className="text-2xl">{emoji}</li>
              <li>{i + 1}</li>
            </Fragment>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="button bg-primary/80 text-secondary"
        onClick={() => {
          graph.reset();
          dispatch(Schedules.clearSchedule('GRAPH_SCHEDULE'));
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
        <span className="mr-2 whitespace-nowrap">Add opposites</span>
        <CuteSwitch
          enabled={flip}
          onChange={(checked) => {
            graph.setFlip(checked);
            setToggleFlip(checked);
          }}
        />
      </div>

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
