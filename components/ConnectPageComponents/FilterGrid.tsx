import { Fragment } from 'react';
import {
  Semester,
  Term, semesterToTerm, termToSemester,
} from '@/src/lib';

export function FilterGrid({
  includedSemesters, setIncludedSemesters, allSemesters,
}: {
  includedSemesters: Term[];
  setIncludedSemesters: (terms: Term[]) => void;
  allSemesters: Semester[];
}) {
  return (
    <div className="grid grid-flow-col grid-rows-3 items-center justify-center justify-items-center">
      <div />
      {['Spring', 'Fall'].map((season) => (
        <FilterButton
          key={season}
          filterTerms={includedSemesters}
          season={season}
          setFilterSemesters={setIncludedSemesters}
          allSemesters={allSemesters}
        />
      ))}

      {/* show a checkbox for each possible semester */}
      {allSemesters.map(({ year, season }) => (
        <Fragment key={`${year}-${season}`}>
          {season === 'Spring' && (
            <FilterButton
              filterTerms={includedSemesters}
              year={year}
              setFilterSemesters={setIncludedSemesters}
              allSemesters={allSemesters}
            />
          )}
          <input
            type="checkbox"
            checked={includedSemesters.includes(semesterToTerm({ year, season }))}
            onChange={(e) => {
              const term = semesterToTerm({ year, season });
              if (e.target.checked) {
                setIncludedSemesters([...includedSemesters, term]);
              } else {
                setIncludedSemesters(includedSemesters.filter((t) => t !== term));
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
