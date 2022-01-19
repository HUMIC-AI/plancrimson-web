import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { DownloadPlan, SEASON_ORDER } from '../shared/firestoreTypes';
import { allTruthy } from '../shared/util';
import useUserData from '../src/context/userData';
import CustomDialog from './CustomDialog';

export default function UploadPlan() {
  const [showDialog, setShowDialog] = useState(false);
  const { createSchedule } = useUserData();

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
        throw new Error('id or schedules field missing on root');
      }
      const results = await Promise.allSettled(
        schedules.map(async (schedule) => {
          if (
            typeof schedule.id !== 'string'
            || !Array.isArray(schedule.classes)
            || typeof schedule.year !== 'number'
            || !(schedule.season in SEASON_ORDER)
          ) {
            throw new Error(`${schedule.id} missing fields`);
          }
          return createSchedule({
            season: schedule.season,
            year: schedule.year,
            classes: schedule.classes,
            id: `${schedule.id}`,
            force: true,
          }).catch((err) => {
            throw new Error(`${schedule.id} threw error ${err.message}`);
          });
        }),
      );
      setShowDialog(false);
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
    <div>
      <button
        type="button"
        onClick={() => setShowDialog(!showDialog)}
        className="hover:opacity-50 transition-opacity underline"
      >
        Upload plan
      </button>

      <CustomDialog
        open={showDialog}
        closeModal={() => setShowDialog(false)}
        title="Upload plan"
      >
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
            className="bg-gray-400 py-2 px-4 rounded-md hover:opacity-50 transition-opacity"
          >
            Submit
          </button>
        </form>
      </CustomDialog>
    </div>
  );
}
