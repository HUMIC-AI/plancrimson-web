import { Dialog } from '@headlessui/react';
import type { DownloadPlan } from 'plancrimson-utils';
import { allTruthy, SEASON_ORDER } from 'plancrimson-utils';
import { Schedules } from '@/src/features';
import { useAppDispatch } from '@/src/hooks';

export default function UploadForm() {
  const dispatch = useAppDispatch();

  const handleUpload: React.FormEventHandler<HTMLFormElement> = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    const file = data.get('plan')?.valueOf() as File;
    if (!file) {
      alert('Please upload a file!');
    }
    try {
      const text = await file.text();
      const { schedules }: DownloadPlan = JSON.parse(text);
      if (!Array.isArray(schedules)) {
        throw new Error('schedules field missing on root');
      }
      const results = await Promise.allSettled(
        schedules.map(async (schedule) => {
          if (
            typeof schedule.title !== 'string'
            || !Array.isArray(schedule.classes)
            || typeof schedule.year !== 'number'
            || !(schedule.season in SEASON_ORDER)
          ) {
            throw new Error(`${schedule.title} invalid or missing fields`);
          }
          return dispatch(Schedules.createSchedule(schedule)).catch((err) => {
            throw new Error(`${schedule.title} threw error ${err.message}`);
          });
        }),
      );

      const rejected = allTruthy(
        results.map((result) => (result.status === 'rejected' ? result.reason.message : null)),
      );
      if (rejected.length > 0) throw new Error(rejected.join(', '));
    } catch (err) {
      console.error(err);
      alert('Invalid file format. Please try again.');
    }
  };

  return (
    <form
      className="flex flex-col items-start space-y-4 bg-white p-6"
      onSubmit={handleUpload}
    >
      <Dialog.Description>Upload a plan</Dialog.Description>
      <input
        type="file"
        name="plan"
        id="planFile"
        accept="application/json"
        className="mt-4"
        required
      />
      <button
        type="submit"
        className="interactive rounded-md bg-gray-light px-4 py-2"
      >
        Submit
      </button>
    </form>
  );
}
