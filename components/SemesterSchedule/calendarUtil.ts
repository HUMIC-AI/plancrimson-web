import { EventAttributes } from 'ics';
import { Class, ExtendedClass, DayOfWeek } from 'plancrimson-utils';

function getUid(cls: ExtendedClass) {
  return `${(cls.id + cls.IS_SCL_MEETING_PAT + cls.IS_SCL_STRT_TM_DEC + cls.IS_SCL_END_TM_DEC).replace(/[^a-zA-Z0-9]/g, '-')}@plancrimson.xyz`;
}

export function getEventTitle(cls: Class) {
  return `${cls.SUBJECT + cls.CATALOG_NBR} (${cls.Title})`;
}

function getDateArr(str: string) {
  const s = new Date(str.slice(0, 10));
  return [s.getUTCFullYear(), s.getUTCMonth() + 1, s.getUTCDate()] as const;
}

function getTimeArr(str: string) {
  const val = parseFloat(str);
  const hours = Math.floor(val);
  const minutes = (val - hours) * 60;
  return [hours, minutes] as const;
}

export function doesRRuleHaveDay(str: string, day: DayOfWeek) {
  const match = str.match(/BYDAY=(.+?);/);
  return match?.[1]?.includes(day.slice(0, 2).toUpperCase()) || false;
}

function getRRule(pattern: string, endDate: string) {
  return `FREQ=WEEKLY;BYDAY=${pattern
    .split(' ')
    .join(',')
    .toUpperCase()};INTERVAL=1;UNTIL=${getDateArr(endDate)
    .map((n) => n.toString().padStart(2, '0'))
    .join('')}T000000Z`;
}

export function decToStr(dec: number) {
  const hours = Math.floor(dec);
  const ret = `${hours.toString().padStart(2, '0')}:${Math.round(
    (dec - hours) * 60,
  )
    .toString()
    .padStart(2, '0')}`;
  return ret;
}

export function strToDec(str: string) {
  const [h, m] = str.split(':').map(parseFloat);
  return h + m / 60;
}

// eslint-disable-next-line import/prefer-default-export
export function getEvents(cls: ExtendedClass): EventAttributes[] {
  if (typeof cls.IS_SCL_MEETING_PAT === 'string') {
    if (cls.IS_SCL_MEETING_PAT === 'TBA') {
      return [];
    }

    if (
      typeof cls.IS_SCL_STRT_TM_DEC === 'string'
      && typeof cls.IS_SCL_END_TM_DEC === 'string'
    ) {
      const event: EventAttributes = {
        uid: getUid(cls),
        start: [
          ...getDateArr(cls.START_DT),
          ...getTimeArr(cls.IS_SCL_STRT_TM_DEC),
        ],
        end: [
          ...getDateArr(cls.START_DT),
          ...getTimeArr(cls.IS_SCL_END_TM_DEC),
        ],
        recurrenceRule: getRRule(cls.IS_SCL_MEETING_PAT, cls.END_DT),
        title: getEventTitle(cls),
        description: cls.textDescription,
      };
      if (cls.URL_URLNAME && cls.URL_URLNAME !== 'NOURL') {
        event.url = cls.URL_URLNAME;
        event.description += `\n\nCourse site: ${cls.URL_URLNAME}`;
      }
      const location = cls.IS_SCL_DESCR_IS_SCL_DESCRG || cls.LOCATION_DESCR_LOCATION;
      if (location) event.location = location;
      return [event];
    }
    // these should have the same length
    const startTimes = cls.IS_SCL_STRT_TM_DEC as string[];
    const endTimes = cls.IS_SCL_END_TM_DEC as string[];
    return startTimes.flatMap((_, i) => getEvents({
      ...cls,
      IS_SCL_STRT_TM_DEC: startTimes[i],
      IS_SCL_END_TM_DEC: endTimes[i],
    }));
  }

  // if meeting pattern is an array
  return cls.IS_SCL_MEETING_PAT.flatMap((pattern, i) => getEvents({
    ...cls,
    IS_SCL_MEETING_PAT: pattern,
    IS_SCL_STRT_TM_DEC:
        typeof cls.IS_SCL_STRT_TM_DEC === 'string'
          ? cls.IS_SCL_STRT_TM_DEC
          : cls.IS_SCL_STRT_TM_DEC[i],
    IS_SCL_END_TM_DEC:
        typeof cls.IS_SCL_END_TM_DEC === 'string'
          ? cls.IS_SCL_END_TM_DEC
          : cls.IS_SCL_END_TM_DEC[i],
  }));
}
