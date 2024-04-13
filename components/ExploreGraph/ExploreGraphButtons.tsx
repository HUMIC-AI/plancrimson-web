import { Fragment, useState } from 'react';
import { Schedules } from '../../src/features';
import { useAppDispatch } from '../../src/utils/hooks';
import { EMOJI_SCALES, GraphState } from './initGraph';
import { CuteSwitch } from '../Utils/CuteSwitch';
import { Subject, getSubjectColor } from '../../src/lib';
import { GRAPH_SCHEDULE } from '../../src/features/schedules';
import { classNames } from '../../src/utils/styles';

export function Buttons({
  graph, subjects,
}: { graph: GraphState; subjects: Subject[]; }) {
  const dispatch = useAppDispatch();
  const [flip, setToggleFlip] = useState(false);

  return (
    <div className={classNames(
      'absolute right-full top-20 mr-4',
      'flex flex-col items-end justify-center space-y-2',
      'rounded-xl transition-colors hover:bg-gray-secondary/50',
    )}
    >
      <button
        type="button"
        className="button bg-primary/80 text-secondary"
        onClick={() => graph.setRatingType(graph.rating === 'meanRating' ? 'meanHours' : 'meanRating')}
      >
        {graph.rating === 'meanRating' ? 'Average rating' : 'Average workload'}
      </button>

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

      <button
        type="button"
        className="button bg-primary/80 text-secondary"
        onClick={() => {
          graph.reset();
          dispatch(Schedules.clearSchedule(GRAPH_SCHEDULE));
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
