/* eslint-disable no-bitwise */
import React from 'react';
import { DateArray, EventAttributes } from 'ics';
import { getOverlap, toPercent } from '@/src/lib';
import { classNames } from '../../src/utils/styles';
import { useModal } from '../../src/context/modal';
import { useAppDispatch } from '../../src/utils/hooks';
import { ClassCache } from '../../src/features';
import { useMeiliClient } from '../../src/context/meili';

type EventTilesProps = {
  events: (EventAttributes & ({ end?: DateArray; isSection?: string; }))[];
  showSections: boolean;
};

export function CalendarDayEventTilesColumn({ events, showSections }: EventTilesProps) {
  const overlapCounter: Record<string, number> = {};
  const dispatch = useAppDispatch();
  const { client } = useMeiliClient();
  const { showCourse } = useModal();

  return (
    <div className="relative h-full odd:bg-gray-secondary even:bg-secondary">
      {events.filter((e) => (showSections ? true : !e.isSection)).map((ev, i) => {
        console.log(ev);
        const overlap = getOverlap(events, i);
        const key = overlap[0].uid!;
        overlapCounter[key] = (overlapCounter[key] || 0) + 1;
        const left = (overlapCounter[key] - 1) / (overlap.length * 3);
        const right = (overlap.length - overlapCounter[key]) / (overlap.length * 3);
        const label = ev.title!.slice(0, ev.title!.indexOf('(') - 1);
        // const title = ev.title!.slice(
        //   ev.title!.indexOf('(') + 1,
        //   ev.title!.length - 1,
        // );

        // get hex color of class based on hash of title
        // if event is a section event, set opacity to 50%
        const rgb = ev.title!.split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0) & 0x00ffffff;
        const hexColor = `#${rgb.toString(16).padStart(6, '0')}${ev.isSection ? '80' : ''}`;

        // set text to either primary or secondary based on luminance
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const textColor = luminance > 128 ? 'text-primary' : 'text-secondary';

        return (
          <div
            key={ev.uid}
            className="absolute z-10 rounded hover:z-20"
            style={{
              top: `${toPercent(ev.start)}%`,
              bottom: `${100 - toPercent(ev.end!)}%`,
              left: `${left * 100}%`,
              right: `${right * 100}%`,
              backgroundColor: hexColor,
            }}
          >
            <div className={classNames('absolute inset-1 overflow-auto text-xs', textColor)}>
              <button
                className="interactive text-base font-semibold"
                type="button"
                onClick={() => dispatch(ClassCache.loadCourses(client, [ev.productId!]))
                  .then(([course]) => showCourse(course))
                  .catch((err) => {
                    console.error(err);
                    alert('Error loading course');
                  })}
              >
                {label}
              </button>
              {ev.isSection && (
              <span>
                Section
                {ev.isSection}
              </span>
              )}
              <p className="italic">{ev.location?.trim() || 'Room TBD'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
