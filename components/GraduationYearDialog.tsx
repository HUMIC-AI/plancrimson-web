import { updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/src/hooks';
import { useModal } from '@/src/context/modal';
import { Schedules, Settings } from '@/src/features';
import Firestore from '@/src/schema';
import { getUniqueSemesters } from 'plancrimson-utils';

/**
 * Rendered in {@link _app.tsx} once user first logs in.
 * Ask the user for their graduation year.
 * On submission, create default schedules for the default years.
 */
export default function GraduationYearDialog({ defaultYear, uid }: { defaultYear: number; uid: string; }) {
  const dispatch = useAppDispatch();
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const defaultSemesters = getUniqueSemesters(classYear);
    const promises = defaultSemesters.map(async ({ year, season }) => {
      const { payload: schedule } = await dispatch(
        Schedules.createDefaultSchedule({ year, season }, uid),
      );
      await dispatch(
        Settings.chooseSchedule({
          term: `${schedule.year}${schedule.season}`,
          scheduleId: schedule.id,
        }),
      );
    });
    const settled = await Promise.allSettled(promises);

    const errors = settled.filter((result) => result.status === 'rejected');
    if (errors.length > 0) {
      console.error('error creating default schedules', errors);
      alert('Error creating default schedules. Please try again later.');
      return;
    }

    try {
      await updateDoc(Firestore.profile(uid), 'classYear', classYear);
    } catch (err) {
      console.error(`error updating class year for ${uid}`, err);
    }

    setOpen(false);

    router.reload();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4"
    >
      <div className="mx-auto flex max-w-xs flex-col items-center space-y-4">
        <h2 className="text-xl font-semibold">What year are you graduating?</h2>
        <input
          type="number"
          name="graduationYear"
          id="graduationYear"
          value={classYear}
          onChange={(e) => setYear(parseInt(e.currentTarget.value, 10))}
          className="w-32 rounded-xl border-4 p-2 text-center text-3xl transition-colors hover:border-black"
        />
        <button type="submit" className="interactive rounded-xl bg-black px-4 py-2 text-white">
          Get started
        </button>
      </div>
    </form>
  );
}
