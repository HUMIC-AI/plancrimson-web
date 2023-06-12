import { Fragment } from 'react';
import {
  Semester,
  Term, semesterToTerm, termToSemester,
} from '@/src/lib';
import { useIncludeSemesters } from '@/src/context/includeSemesters';

export function FilterGrid({
  allSemesters,
}: {
  allSemesters: Semester[];
}) {
  const { includeSemesters, setIncludeSemesters } = useIncludeSemesters();

  return (
    <div className="grid grid-flow-col grid-rows-3 items-center justify-center justify-items-center">
      <div />
      {['Spring', 'Fall'].map((season) => (
        <FilterButton
          key={season}
          filterTerms={includeSemesters}
          season={season}
          setFilterSemesters={setIncludeSemesters}
          allSemesters={allSemesters}
        />
      ))}

      {/* show a checkbox for each possible semester */}
      {allSemesters.map(({ year, season }) => (
        <Fragment key={`${year}-${season}`}>
          {season === 'Spring' && (
            <FilterButton
              filterTerms={includeSemesters}
              year={year}
              setFilterSemesters={setIncludeSemesters}
              allSemesters={allSemesters}
            />
          )}
          <input
            type="checkbox"
            checked={includeSemesters.includes(semesterToTerm({ year, season }))}
            onChange={(e) => {
              const term = semesterToTerm({ year, season });
              if (e.target.checked) {
                setIncludeSemesters([...includeSemesters, term]);
              } else {
                setIncludeSemesters(includeSemesters.filter((t) => t !== term));
              }
            }}
          />
        </Fragment>
      ))}
    </div>
  );
}

function FilterButton({
  filterTerms, season, year, setFilterSemesters, allSemesters,
}: {
  filterTerms: Term[];
  season?: string;
  year?: number;
  setFilterSemesters: (terms: Term[]) => void;
  allSemesters: Semester[];
}): JSX.Element {
  const key = season ? 'season' : 'year';
  const value = season || year;

  return (
    <button
      type="button"
      className="interactive mx-1 my-0.5 rounded-lg bg-gray-secondary px-2 py-1 text-sm"
      onClick={() => {
        const exists = filterTerms.some((term) => termToSemester(term)[key] === value);
        if (exists) {
          setFilterSemesters(filterTerms.filter((term) => termToSemester(term)[key] !== value));
        } else {
          setFilterSemesters([
            ...filterTerms,
            ...allSemesters.filter((semester) => semester[key] === value).map(semesterToTerm),
          ]);
        }
      }}
    >
      {value}
    </button>
  );
}
