import React, { useState } from 'react';
import { useModal } from '@/src/context/modal';
import { FaSpinner } from 'react-icons/fa';

/**
 * Rendered in _app.tsx once user first logs in and they don't have a profile created yet
 * Ask the user for their graduation year.
 * On submission, create their profile and default schedules for the default years.
 */
export default function GraduationYearDialog({ defaultYear, handleSubmit }: {
  defaultYear: number;
  handleSubmit: (classYear: number) => Promise<void>;
}) {
  const { setOpen } = useModal();
  const [classYear, setYear] = useState(defaultYear);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const submission = handleSubmit(classYear);
    const timer = new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    await Promise.all([submission, timer]);
    setLoading(false);
    setOpen(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="p-4"
    >
      <div className="mx-auto flex max-w-xs flex-col items-center space-y-4">
        <h2 className="text-xl font-semibold">What year are you graduating?</h2>

        <input
          type="number"
          name="graduationYear"
          id="graduationYear"
          value={classYear}
          onChange={(e) => setYear(parseInt(e.currentTarget.value, 10))}
          className="w-32 rounded-xl border-4 bg-gray-secondary p-2 text-center text-3xl text-primary"
        />

        <p className="text-center">Your activity on this site will be public to other users by default.</p>

        <div className="relative">
          <button type="submit" className="interactive rounded-xl bg-gray-secondary px-4 py-2 font-bold">
            Get started
          </button>
          {loading && (
            <div className="absolute inset-y-0 left-full ml-2 flex items-center justify-center">
              <FaSpinner className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
