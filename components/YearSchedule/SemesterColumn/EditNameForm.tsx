import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';

export function EditNameForm({ title, setEditing, handleSubmit }: {
  title: string;
  setEditing: (editing: boolean) => void;
  handleSubmit: (title: string) => Promise<unknown>;
}) {
  const [scheduleTitle, setScheduleTitle] = useState(title);

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(scheduleTitle)
          .then(() => {
            setEditing(false);
          })
          .catch((err) => {
            alert(err.message);
            console.error(err);
          });
      }}
    >
      <input
        type="text"
        value={scheduleTitle}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        onChange={({ currentTarget }) => setScheduleTitle(
          currentTarget.value
            .replace(/[^a-zA-Z0-9-_ ]/g, '')
            .slice(0, 30),
        )}
        className="w-full rounded border-2 py-1 pl-2 pr-7 shadow-inner focus:shadow"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-2 flex items-center"
      >
        <FaCheck />
      </button>
    </form>
  );
}
