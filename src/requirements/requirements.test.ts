import { getSchoolYear } from './util';
import HONORS_SAMPLES from './cs/sample/honors.json';
import validateSchedules from '.';
import honorsRequirements from './cs/honors';
import { Schedule, UserData } from '../../shared/firestoreTypes';

describe('getSchoolYear', () => {
  it('works on a fall semester', () => {
    expect(getSchoolYear({ year: 2021, season: 'Fall' }, 2025)).toBe(1);
  });
  it('works on a spring semester', () => {
    expect(getSchoolYear({ year: 2022, season: 'Spring' }, 2025)).toBe(1);
  });
  it('works on the last year', () => {
    expect(getSchoolYear({ year: 2025, season: 'Spring' }, 2025)).toBe(4);
  });
});

describe('Requirements', () => {
  test('sample honors requirements meets requirements', () => {
    const mockSchedules: UserData['schedules'] = {};
    HONORS_SAMPLES[0].schedules.forEach((schedule) => {
      mockSchedules[schedule.id] = { ...schedule } as Schedule;
    });

    expect(
      validateSchedules(
        honorsRequirements,
        HONORS_SAMPLES[0].schedules as Schedule[],
        {
          classYear: 2025,
          lastLoggedIn: new Date(),
          schedules: mockSchedules,
          selectedSchedules: {},
        },
        {},
      ).satisfied,
    ).toBe(true);
  });
});
