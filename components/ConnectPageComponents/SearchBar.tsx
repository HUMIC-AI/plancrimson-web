import { Term } from '@/src/lib';

export function SearchBar({
  handleChange, setFriendsOnly, friendsOnly, includedSemesters,
}: {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFriendsOnly: (friendsOnly: boolean) => void;
  friendsOnly: boolean;
  includedSemesters: Term[];
}) {
  return (
    <div>
      <div className="flex">
        <input
          type="text"
          placeholder="Search for a classmate"
          className="w-full flex-1 rounded-lg bg-gray-secondary px-3 py-2"
          onChange={handleChange}
        />
        <button
          type="button"
          className="interactive ml-2 rounded-lg bg-gray-secondary px-2 text-sm font-medium"
          onClick={() => setFriendsOnly(!friendsOnly)}
        >
          {friendsOnly ? 'Friends' : 'All'}
        </button>
      </div>

      <p className="mt-2 text-center text-xs sm:text-left">
        {includedSemesters.length === 0 ? (
          'Searching profiles. Pick a semester to search schedules.'
        ) : (
          'Searching schedules. Clear semesters to search profiles.'
        )}
      </p>
    </div>
  );
}
