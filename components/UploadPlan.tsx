import { Dialog } from '@headlessui/react';
import { DownloadPlan, SEASON_ORDER } from '../shared/firestoreTypes';
import { allTruthy } from '../shared/util';
import { useAppDispatch } from '../src/app/hooks';
import { useModal } from '../src/features/modal';
import { createSchedule } from '../src/features/schedules';

function UploadForm() {
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
            typeof schedule.id !== 'string'
            || !Array.isArray(schedule.classes)
            || typeof schedule.year !== 'number'
            || !(schedule.season in SEASON_ORDER)
          ) {
            throw new Error(`${schedule.id} invalid or missing fields`);
          }
          return dispatch(createSchedule({
            season: schedule.season,
            year: schedule.year,
            classes: schedule.classes,
            id: `${schedule.id}`,
            force: true,
          })).catch((err) => {
            throw new Error(`${schedule.id} threw error ${err.message}`);
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
      className="bg-white p-6 flex flex-col items-start space-y-4"
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
        className="bg-gray-400 py-2 px-4 rounded-md interactive"
      >
        Submit
      </button>
    </form>
  );
}

export default function UploadPlan() {
  const { showContents } = useModal();

  return (
    <button
      type="button"
      onClick={() => showContents({
        content: <UploadForm />,
        title: 'Upload plan',
      })}
      className="underline interactive"
    >
      Upload plan
    </button>
  );
}
