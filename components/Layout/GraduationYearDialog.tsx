import React, { useState } from 'react';
import { useModal } from '@/src/context/modal';

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSubmit(classYear);
    setOpen(false);
  }

  return (
    <form
      onSubmit={onSubmit}
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
