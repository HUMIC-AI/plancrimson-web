import React from 'react';
import { EventAttributes } from 'ics';
import { getOverlap, toPercent } from '@/src/lib';

export function DayComponent({ events }: { events: EventAttributes[]; }) {
  const overlapCounter: Record<string, number> = {};

  return (
    <div className="relative h-full odd:bg-gray-secondary even:bg-secondary">
      {events.map((ev, i) => {
        const overlap = getOverlap(events, i);
        const key = overlap[0].uid!;
        overlapCounter[key] = (overlapCounter[key] || 0) + 1;
        const left = (overlapCounter[key] - 1) / (overlap.length * 3);
        const right = (overlap.length - overlapCounter[key]) / (overlap.length * 3);
        const label = ev.title!.slice(0, ev.title!.indexOf('(') - 1);
        const title = ev.title!.slice(
          ev.title!.indexOf('(') + 1,
          ev.title!.length - 1,
        );
        return (
          <div
            key={ev.uid}
            className="absolute z-10 rounded bg-black/70 hover:z-20"
            style={{
              top: `${toPercent(ev.start)}%`,
              // @ts-expect-error
              bottom: `${100 - toPercent(ev.end)}%`,
              left: `${left * 100}%`,
              right: `${right * 100}%`,
            }}
          >
            <div className="absolute inset-2 flex flex-col items-center overflow-auto text-center">
              <span className="font-semibold">{label}</span>
              <span>{title}</span>
              <span className="italic">{ev.location}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
